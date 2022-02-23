import { isDomainName } from "../utils";
import { DomainNameError } from "../errors";
import {
  RevisionsApi,
  RevisionMetadata,
  ContentRevision,
} from "../mediawiki/revisions";
import log from "loglevel";

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
    | Promise<ConfigurationRevision<ConfigurationDefinitionType> | undefined>
    | undefined
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

  abstract parse(content: string): ConfigurationDefinitionType[];

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
  ): Promise<ConfigurationRevision<ConfigurationDefinitionType> | undefined> {
    const api = new RevisionsApi(this.mediawiki.instance);
    const revisions = await api.fetchRevisions(this.title, true, revid, 1);
    const revision = revisions[0];

    if (revision === undefined) {
      let info = `No revision found for page "${this.title}"`;
      if (revid !== undefined) info = info + ` and revid ${revid}`;
      log.info(info);
      return undefined;
    }

    if (revision.content === undefined) {
      return Promise.reject(`Unexpected undefined revision content`);
    }

    const strippedContent = revision.content
      .replace('<syntaxhighlight lang="json">', "")
      .replace("</syntaxhighlight>", "");

    let configuration: ConfigurationDefinitionType[];
    try {
      configuration = this.parse(strippedContent);
    } catch (e) {
      let message = "Could not parse revision content";
      if (e instanceof Error) message = message + `: ${e.message}`;
      throw new ContentRevisionError(message, revision);
    }

    return {
      revid: revision.revid,
      timestamp: revision.timestamp,
      configuration: configuration,
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
  ): Promise<ConfigurationRevision<ConfigurationDefinitionType> | undefined> {
    let revisionPromise = this.revisionCache.get(revid);
    if (revisionPromise === undefined || refresh) {
      revisionPromise = this.fetchRevision(revid);
      this.revisionCache.set(revid, revisionPromise);
    }
    return revisionPromise;
  }

  getLatestRevision(): Promise<
    ConfigurationRevision<ConfigurationDefinitionType> | undefined
  > {
    return this.fetchRevision().then((revision) => {
      if (revision !== undefined) {
        const revisionPromise = Promise.resolve(revision);
        this.revisionCache.set(revision.revid, revisionPromise);
      }
      return revision;
    });
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

class ContentRevisionError extends Error {
  revision: ContentRevision;
  constructor(message: string, revision: ContentRevision) {
    super(message);
    this.revision = revision;
    this.name = "ContentRevisionError";
  }
}
