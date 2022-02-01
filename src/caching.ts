import fetch from "node-fetch";
import { fetchSimpleCitation, SimpleCitoidCitation } from "./citoid";
import { DOMParser } from "@xmldom/xmldom";

abstract class ResponseCache {
  url: string;
  abstract getData(refresh: boolean): Promise<CacheData>;
  abstract fetchData(): Promise<CacheData>;
  // if using this["_dataPromise"] below, can't make this protected; see
  // https://stackoverflow.com/questions/68748602/typescript-get-correct-return-type-in-subclass-of-abstract-class
  protected _dataPromise: Promise<CacheData> | undefined;
  protected _refreshing: boolean;

  constructor(urlString: string) {
    this.url = urlString;
    this._refreshing = false;
  }

  // getData(refresh = false): ReturnType<this["fetchData"]> {
  // getData(refresh = false): Exclude<this["_dataPromise"], undefined> {
  // getData(refresh = false): this["_dataPromise"] {
  protected _getData(refresh = false): Promise<CacheData> {
    if (this._dataPromise === undefined) {
      return (this._dataPromise = this.fetchData());
    } else if (refresh && !this._refreshing) {
      return (this._dataPromise = this.fetchData());
    } else {
      return this._dataPromise;
    }
  }
}

interface CacheData {
  timestamp: string;
}

interface HttpCacheData extends CacheData {
  body: string;
  doc: Document;
  headers: Map<string, string>;
}

class HttpCache extends ResponseCache {
  _dataPromise: Promise<HttpCacheData> | undefined;
  constructor(url: string) {
    super(url);
  }

  getData(refresh = false): Promise<HttpCacheData> {
    return this._getData(refresh) as Promise<HttpCacheData>;
  }

  fetchData(): Promise<HttpCacheData> {
    this._refreshing = true;
    return new Promise<HttpCacheData>((resolve, reject) => {
      // if better dom support required, consider using JSDOM.fromURL() instead
      fetch(this.url)
        .then(async (response) => {
          if (response.ok) {
            const body = await response.text();
            const data: HttpCacheData = {
              body,
              // xpath library recommends xmldom (vs e. g. htmlparser2)
              doc: new DOMParser().parseFromString(body),
              headers: new Map(response.headers),
              timestamp: new Date().toISOString(),
            };
            this._refreshing = false;
            resolve(data);
          } else {
            this._refreshing = false;
            reject("response status not ok");
          }
        })
        .catch((reason) => {
          reject(reason);
        });
    });
  }
}

interface CitoidCacheData extends CacheData {
  citation: SimpleCitoidCitation;
}

class CitoidCache extends ResponseCache {
  _dataPromise: Promise<CitoidCacheData> | undefined;
  constructor(url: string) {
    super(url);
  }

  getData(refresh = false): Promise<CitoidCacheData> {
    return this._getData(refresh) as Promise<CitoidCacheData>;
  }

  fetchData(): Promise<CitoidCacheData> {
    return new Promise<CitoidCacheData>((resolve, reject) => {
      fetchSimpleCitation(this.url)
        .then((citation) => {
          const data: CitoidCacheData = {
            citation: citation,
            timestamp: new Date().toISOString(),
          };
          resolve(data);
        })
        .catch((reason) => {
          reject(reason);
        });
    });
  }
}

export { CitoidCache, HttpCache };
