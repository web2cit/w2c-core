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
    Promise<ContentRevision | undefined> | undefined
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

  move?(id: string, newIndex: number): void;

  abstract remove(id: string): void;

  // it would make sense that this method be static
  // but typescript doesn't seem to support abstract static members
  // see https://github.com/microsoft/TypeScript/issues/34516
  abstract parse(content: string): ConfigurationDefinitionType[];

  abstract loadConfiguration(
    configuration: ConfigurationDefinitionType[]
  ): void;

  get title() {
    return this.storage.root + this.storage.path + this.storage.filename;
  }

  /**
   * Fetch the corresponding configuration revisions from the remote storage.
   * @returns {RevisionMetadata[]} An array of revisions, including revision ID
   *     and timestamp.
   */
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

  /**
   * Fetch revision content
   * @param {number} [revid] - The ID of the revision to fetch. If undefined,
   *     fetches the latest revision.
   * @returns {ContentRevision|undefined} A revision metadata, including its
   *     content. Undefined if no matching revision found.
   */
  private async fetchRevision(
    revid?: RevisionMetadata["revid"]
  ): Promise<ContentRevision | undefined> {
    const api = new RevisionsApi(this.mediawiki.instance);
    const revisions = await api.fetchRevisions(this.title, true, revid, 1);
    const revision = revisions[0];

    if (revision === undefined) {
      let info = `No revision found for page "${this.title}"`;
      if (revid !== undefined) info = info + ` and revid ${revid}`;
      log.info(info);
    }

    return revision;
  }

  /**
   * fetchRevisionIds wrapper
   * @param refresh=false - Whether to re-fetch the IDs
   * @returns A promise that resolves to an array of revision metadata objects.
   */
  getRevisionIds(refresh = false): Promise<RevisionMetadata[]> {
    if (this.revisions === undefined || refresh) {
      this.revisions = this.fetchRevisionIds();
    }
    return this.revisions;
  }

  /**
   * fetchRevision wrapper
   * @param {number} revid - The ID of the revision to get
   * @param {boolean} [refresh=false] - Whether to re-fetch revision content
   * @returns A promise that resolves to a revision metadata object including
   *     revision content, or to undefined.
   */
  getRevision(
    revid: RevisionMetadata["revid"],
    refresh = false
  ): Promise<ContentRevision | undefined> {
    let revisionPromise = this.revisionCache.get(revid);
    if (revisionPromise === undefined || refresh) {
      revisionPromise = this.fetchRevision(revid);
      this.revisionCache.set(revid, revisionPromise);
    }
    return revisionPromise;
  }

  /**
   * fetchRevision wrapper that gets metadata for the latest revision
   * @returns A promise that resolves to the latest revision metadata
   */
  getLatestRevision(): Promise<ContentRevision | undefined> {
    return this.fetchRevision().then((revision) => {
      if (revision !== undefined) {
        const revisionPromise = Promise.resolve(revision);
        this.revisionCache.set(revision.revid, revisionPromise);
      }
      return revision;
    });
  }

  /**
   * Loads a revision's content as domain configuration
   * @param {ContentRevision} revision - The revision to load
   */
  loadRevision(revision: ContentRevision): void {
    if (revision.content === undefined) {
      throw new ContentRevisionError(
        `Unexpected undefined revision content`,
        revision
      );
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

    this.loadConfiguration(configuration);
    this.currentRevid = revision.revid;
  }

  fetchAndLoad(): Promise<void> {
    return this.getLatestRevision().then((revision) => {
      if (revision !== undefined) {
        try {
          this.loadRevision(revision);
        } catch (error) {
          throw new Error(
            `Could not load ${this.storage.filename} ` +
              `revision id ${revision.revid}: ${error}`
          );
        }
      }
    });
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

class ContentRevisionError extends Error {
  revision: ContentRevision;
  constructor(message: string, revision: ContentRevision) {
    super(message);
    this.revision = revision;
    this.name = "ContentRevisionError";
  }
}
