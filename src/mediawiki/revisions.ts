import fetch, { Response } from "node-fetch";
import log from "loglevel";
import { HTTPResponseError } from "../errors";

class RevisionsApi {
  instance: string;
  path: string;
  rvlimitMax: number;

  static isResponse(response: unknown): response is RevisionsApiResponse {
    if (
      (response as RevisionsApiResponse).query !== undefined &&
      (response as RevisionsApiResponse).query.pages !== undefined
    ) {
      return true;
    } else {
      return false;
    }
  }

  constructor(
    instance = "https://meta.wikimedia.org",
    path = "/w/api.php",
    rvlimitMax = 500
  ) {
    this.instance = instance;
    this.path = path;
    this.rvlimitMax = rvlimitMax;
  }

  async fetchRevisions(
    title: string, //
    fetchContent: boolean,
    startid?: number,
    max?: number
  ): Promise<ContentRevision[]> {
    const revisions: ContentRevision[] = [];

    const rvprop = ["ids", "timestamp"];
    if (fetchContent) rvprop.push("content");

    let rvlimit: number;
    if (max !== undefined && max < this.rvlimitMax) {
      rvlimit = max;
    } else {
      rvlimit = this.rvlimitMax;
    }

    const params: {
      [param: string]: string | number | undefined;
    } = {
      action: "query",
      prop: "revisions",
      titles: title,
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
      const url = this.instance + this.path + "?" + query;

      let response: Response;
      try {
        response = await fetch(url);
        if (!response.ok) {
          throw new HTTPResponseError(url, response);
        }
      } catch (e) {
        throw new Error(`Failed to fecth ${url}`);
      }

      let jsonResponse;
      try {
        jsonResponse = await response.json();
      } catch {
        throw new RevisionsApiError(
          "Revisions API response is not a valid JSON",
          response
        );
      }

      if (!RevisionsApi.isResponse(jsonResponse)) {
        throw new RevisionsApiError(
          "Unexpected Revisions API JSON response format",
          response
        );
      }

      const page = Object.values(jsonResponse.query.pages)[0];
      if (page !== undefined) {
        if ("missing" in page) {
          log.info(`Page ${title} does not exist`);
        } else {
          page.revisions.forEach((apiRevision) => {
            const revision: ContentRevision = {
              revid: apiRevision.revid,
              timestamp: apiRevision.timestamp,
              content: apiRevision.slots?.main.content,
            };
            revisions.push(revision);
          });
        }
      }
      params.rvcontinue = jsonResponse.continue?.rvcontinue;
    } while (params.rvcontinue !== undefined);

    return revisions.slice(0, max);
  }
}

type RevisionMetadata = {
  revid: number;
  timestamp: string;
};

interface ContentRevision extends RevisionMetadata {
  content?: string;
}

interface RevisionsApiResponse {
  continue?: {
    rvcontinue: string;
  };
  query: {
    pages: {
      [pageid: string]: PageApiResponse | MissingPageApiResponse;
    };
  };
}

interface PageApiResponse {
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
}

interface MissingPageApiResponse {
  missing: true;
}

class RevisionsApiError extends Error {
  response: Response;
  constructor(message: string, response: Response) {
    super(message);
    this.response = response;
    this.name = "RevisionsApiError";
  }
}

export { RevisionsApi, RevisionMetadata, ContentRevision };
