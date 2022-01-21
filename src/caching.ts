import fetch from "node-fetch";
import { translateUrl, MediaWikiBaseFieldCitation } from "./citoid";

abstract class ResponseCache {
  data: CacheData | undefined;
  url: string;
  abstract refresh(): Promise<CacheData>;
  refreshPromise: Promise<CacheData> | undefined;

  constructor(urlString: string) {
    this.url = urlString;
  }
}

interface CacheData {
  timestamp: string;
}

interface HttpCacheData extends CacheData {
  body: string;
  headers: Map<string, string>;
}

class HttpCache extends ResponseCache {
  data: HttpCacheData | undefined;
  refreshPromise: Promise<HttpCacheData> | undefined;
  constructor(url: string) {
    super(url);
  }

  refresh(): Promise<HttpCacheData> {
    this.refreshPromise = new Promise<HttpCacheData>((resolve, reject) => {
      fetch(this.url)
        .then(async (response) => {
          if (response.ok) {
            this.data = {
              body: await response.text(),
              headers: new Map(response.headers),
              timestamp: new Date().toISOString(),
            };
            resolve(this.data);
          } else {
            reject("response status not ok");
          }
        })
        .catch((reason) => {
          reject(reason);
        });
    });
    return this.refreshPromise as Promise<HttpCacheData>;
  }
}

interface CitoidCacheData extends CacheData {
  citation: MediaWikiBaseFieldCitation;
}

class CitoidCache extends ResponseCache {
  data: CitoidCacheData | undefined;
  refreshPromise: Promise<CitoidCacheData> | undefined;
  constructor(url: string) {
    super(url);
  }

  refresh(): Promise<CitoidCacheData> {
    this.refreshPromise = new Promise<CitoidCacheData>((resolve, reject) => {
      translateUrl(this.url)
        .then((citation) => {
          this.data = {
            citation: citation,
            timestamp: new Date().toISOString(),
          };
          resolve(this.data);
        })
        .catch((reason) => {
          reject(reason);
        });
    });
    return this.refreshPromise as Promise<CitoidCacheData>;
  }
}

export { CitoidCache, HttpCache };
