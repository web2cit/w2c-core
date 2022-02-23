import { isDomainName } from "../utils";
import { DomainNameError } from "../errors";
import { RevisionsApi, RevisionMetadata } from "../mediawiki/revisions";

export abstract class DomainConfiguration<
  ConfigurationType extends { toJSON(): ConfigurationDefinitionType },
  ConfigurationDefinitionType
> {
  domain: string;
  mediawiki: {
    instance: string;
    wiki: string;
  };
  storage: {
    root: string;
    path: string;
    filename: string;
  };

  protected values: ConfigurationType[] = [];

  revisions: Promise<RevisionMetadata[]> | undefined;
  revisionCache: Map<
    RevisionMetadata["revid"],
    Promise<ConfigurationRevision<ConfigurationDefinitionType>> | undefined
  > = new Map();
  currentRevid: RevisionMetadata["revid"] | undefined;

  constructor(
    domain: string,
    storageFilename: string,
    configuration?: ConfigurationDefinitionType[],
    storageRoot = "Web2Cit/data/",
    mwInstance = "https://meta.wikimedia.org",
    mwWiki = "/wiki/"
  ) {
    if (!isDomainName(domain)) {
      throw new DomainNameError(domain);
    }
    this.domain = domain;
    const labels = domain.split(".");
    labels.reverse();
    this.storage = {
      root: storageRoot,
      path: labels.join("/") + "/",
      filename: storageFilename,
    };
    if (configuration) this.loadConfiguration(configuration);
    this.mediawiki = {
      instance: mwInstance,
      wiki: mwWiki,
    };
  }

  abstract get(id?: string | string[]): ConfigurationType[];

  abstract add(
    definition: ConfigurationDefinitionType,
    index: number
  ): ConfigurationType;

  abstract move(id: string, newIndex: number): void;

  abstract remove(id: string): void;

  abstract loadConfiguration(
    configuration: ConfigurationDefinitionType[]
  ): void;

  get title() {
    return this.storage.root + this.storage.path + this.storage.filename;
  }

  private async fetchRevisionIds(): Promise<RevisionMetadata[]> {
    const api = new RevisionsApi(this.mediawiki.instance);
    const revisions = await api.fetchRevisions(this.title, false);
    return revisions.map((revision) => {
      return {
        revid: revision.revid,
        timestamp: revision.timestamp,
      };
    });
  }

  private async fetchRevision(
    revid?: RevisionMetadata["revid"]
  ): Promise<ConfigurationRevision<ConfigurationDefinitionType>> {
    const api = new RevisionsApi(this.mediawiki.instance);
    const revisions = await api.fetchRevisions(this.title, true, revid, 1);
    const revision = revisions[0];

    if (revision === undefined) {
      return Promise.reject(`No revision found for revid ${revid}`);
    }

    if (revision.content === undefined) {
      return Promise.reject(`Unexpected undefined revision content`);
    }

    // todo: do not parse content here
    const strippedContent = revision.content
      .replace('<syntaxhighlight lang="json">', "")
      // fixme: why do we have to escape?
      .replace("</syntaxhighlight>", "");

    let jsonContent;
    try {
      jsonContent = JSON.parse(strippedContent);
    } catch {
      // todo: include strippedContent in the rejection
      return Promise.reject("Failed to JSON-parse the revision content");
    }

    return {
      revid: revision.revid,
      timestamp: revision.timestamp,
      configuration: jsonContent,
    };
  }

  getRevisionIds(refresh = false): Promise<RevisionMetadata[]> {
    if (this.revisions === undefined || refresh) {
      this.revisions = this.fetchRevisionIds();
    }
    return this.revisions;
  }

  getRevision(
    revid: RevisionMetadata["revid"],
    refresh = false
  ): Promise<ConfigurationRevision<ConfigurationDefinitionType>> {
    let revision = this.revisionCache.get(revid);
    if (revision === undefined || refresh) {
      revision = this.fetchRevision(revid);
      this.revisionCache.set(revid, revision);
    }
    return revision;
  }

  getLatestRevision(): Promise<
    ConfigurationRevision<ConfigurationDefinitionType>
  > {
    return this.fetchRevision().then((revision) => {
      this.revisionCache.set(revision.revid, Promise.resolve(revision));
      return revision;
    });
    // return new Promise(async (resolve, reject) => {
    //     try {
    //         const revision = await this.fetchRevision();
    //         this.revisionCache.set(revision.revid, Promise.resolve(revision));
    //         resolve(revision);
    //     } catch (e) {
    //         reject(e);
    //     }
    // });
  }

  loadRevision(
    revision: ConfigurationRevision<ConfigurationDefinitionType>
  ): void {
    this.loadConfiguration(revision.configuration);
    this.currentRevid = revision.revid;
  }

  toJSON(): ConfigurationDefinitionType[] {
    return this.values.map((value) => value.toJSON());
  }

  save(): void {
    const saveToPath =
      this.mediawiki.instance +
      this.mediawiki.wiki +
      this.storage.root +
      this.storage.path +
      this.storage.filename;
    console.log(`\
Automatic saving not yet supported. Save the following JSON to \
"${saveToPath}":
${this.toJSON()}
`);
  }
}

interface ConfigurationRevision<T> extends RevisionMetadata {
  configuration: T[];
}
