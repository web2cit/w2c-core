import fetch from "node-fetch";
import { translateUrl, MediaWikiBaseFieldCitation } from "./citoid";

abstract class ResponseCache {
  timestamp = "";
  url: string;
  abstract refresh(): Promise<void>;
  refreshPromise: Promise<void> | undefined;

  constructor(urlString: string) {
    this.url = urlString;
  }
}

class HttpCache extends ResponseCache {
  body = "";
  headers: Map<string, string> = new Map();

  constructor(url: string) {
    super(url);
  }

  refresh(): Promise<void> {
    this.refreshPromise = new Promise<void>((resolve, reject) => {
      fetch(this.url)
        .then(async (response) => {
          if (response.ok) {
            this.timestamp = new Date().toISOString();
            this.headers = new Map(response.headers);
            this.body = await response.text();
            resolve();
          } else {
            reject("response status not ok");
          }
        })
        .catch((reason) => {
          reject(reason);
        });
    });
    return this.refreshPromise;
  }
}

class CitoidCache extends ResponseCache {
  citation: MediaWikiBaseFieldCitation | undefined;

  constructor(url: string) {
    super(url);
  }

  refresh(): Promise<void> {
    this.refreshPromise = new Promise<void>((resolve, reject) => {
      translateUrl(this.url)
        .then((citation) => {
          this.timestamp = new Date().toISOString();
          this.citation = citation;
          resolve();
        })
        .catch((reason) => {
          reject(reason);
        });
    });
    return this.refreshPromise;
  }
}

export { CitoidCache, HttpCache };
