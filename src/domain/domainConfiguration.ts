import fetch from "node-fetch";
import { isDomainName } from "../utils";
import { DomainNameError } from "../errors";

const MEDIAWIKI_INSTANCE = "https://meta.wikimedia.org";
const API_PATH = "/w/api.php";
const WIKI_PATH = "/wiki/";
const RVLIMIT_MAX = 500;

export abstract class DomainConfiguration<
  ConfigurationType extends { toJSON(): ConfigurationDefinitionType },
  ConfigurationDefinitionType
> {
  domain: string;
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
    storageRoot = "Web2Cit/data/"
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

  private async fetchRevisions(
    fetchContent: boolean,
    startid?: number,
    max?: number
  ): Promise<ContentRevision[]> {
    const revisions: ContentRevision[] = [];

    const rvprop = ["ids", "timestamp"];
    if (fetchContent) rvprop.push("content");

    let rvlimit: number;
    if (max !== undefined && max < RVLIMIT_MAX) {
      rvlimit = max;
    } else {
      rvlimit = RVLIMIT_MAX;
    }

    const params: {
      [param: string]: string | number | undefined;
    } = {
      action: "query",
      prop: "revisions",
      titles: this.storage.root + this.storage.path + this.storage.filename,
      rvprop: rvprop.join("|"),
      rvlimit,
      rvslots: "main",
      rvstartid: startid,
      rvcontinue: undefined,
      formatversion: "2",
      format: "json",
    };

    do {
      if (max !== undefined && revisions.length >= max) {
        break;
      }
      const query = Object.entries(params)
        .reduce((query: string[], [param, value]) => {
          if (value !== undefined) {
            query.push(`${param}=${value}`);
          }
          return query;
        }, [])
        .join("&");
      const url = MEDIAWIKI_INSTANCE + API_PATH + "?" + query;

      let jsonResponse;
      // eslint-disable-next-line no-useless-catch
      try {
        const response = await fetch(url);
        jsonResponse = await response.json();
      } catch (e) {
        // fixme
        throw e;
      }
      if (!isRevisionsApiResponse(jsonResponse)) {
        // fixme
        throw new Error();
      }

      const page = Object.values(jsonResponse.query.pages)[0];
      if (page !== undefined) {
        page.revisions.forEach((apiRevision) => {
          const revision: ContentRevision = {
            revid: apiRevision.revid,
            timestamp: apiRevision.timestamp,
            content: apiRevision.slots?.main.content,
          };
          revisions.push(revision);
        });
      }
      params.rvcontinue = jsonResponse.continue?.rvcontinue;
    } while (params.rvcontinue !== undefined);

    return revisions.slice(0, max);
  }

  async fetchRevisionIds(): Promise<RevisionMetadata[]> {
    const revisions = await this.fetchRevisions(false);
    return revisions.map((revision) => {
      return {
        revid: revision.revid,
        timestamp: revision.timestamp,
      };
    });
  }

  async fetchRevision(
    revid?: RevisionMetadata["revid"]
  ): Promise<ConfigurationRevision<ConfigurationDefinitionType>> {
    const revisions = await this.fetchRevisions(true, revid, 1);
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
      MEDIAWIKI_INSTANCE +
      WIKI_PATH +
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

type RevisionMetadata = {
  revid: number;
  timestamp: string;
};

interface ContentRevision extends RevisionMetadata {
  content?: string;
}

interface ConfigurationRevision<T> extends RevisionMetadata {
  configuration: T[];
}

interface RevisionsApiResponse {
  continue?: {
    rvcontinue: string;
  };
  query: {
    pages: {
      [pageid: string]: {
        pageid: number;
        ns: number;
        title: string;
        revisions: {
          revid: number;
          parentid: number;
          timestamp: string;
          slots?: {
            main: {
              contentmodel: string;
              contentformat: string;
              content: string;
            };
          };
        }[];
      };
    };
  };
}

function isRevisionsApiResponse(
  response: unknown
): response is RevisionsApiResponse {
  if (
    (response as RevisionsApiResponse).query !== undefined &&
    (response as RevisionsApiResponse).query.pages !== undefined
  ) {
    return true;
  } else {
    return false;
  }
}
