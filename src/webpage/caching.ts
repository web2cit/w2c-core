// node-fetch 3 does not support jest yet
// https://github.com/node-fetch/node-fetch/issues/1265
import fetch from "node-fetch";
import { fetchSimpleCitation, SimpleCitoidCitation } from "../citoid";
import { JSDOM } from "jsdom";

abstract class ResponseCache {
  url: string;
  timestamp: string | undefined;
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

type CacheData = HttpCacheData | CitoidCacheData;

interface HttpCacheData {
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
      // alternatively use JSDOM.fromURL();
      fetch(this.url)
        .then(async (response) => {
          if (response.ok) {
            const body = await response.text();
            const { window } = new JSDOM(body, { url: response.url });
            // const document = cleanDom(window);
            const document = window.document;
            const data: HttpCacheData = {
              body,
              doc: document,
              headers: new Map(response.headers),
            };
            this.timestamp = new Date().toISOString();
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

function cleanDom(window: JSDOM["window"]): Document {
  const document = window.document;
  const treeWalker = document.createTreeWalker(
    document,
    window.NodeFilter.SHOW_TEXT
  );
  let currentNode: Text | null = treeWalker.currentNode as Text;
  while (currentNode) {
    // fixme: for some reason the tree walker includes the document node
    const textContent = currentNode.textContent ?? "";
    // removing all whitespace text nodes would not work
    // some whitespace text nodes should be kept
    // e.g., between inline elements: <p><em>...</em> <a>...</a><p>
    // if (!(/[^\t\n\r ]/.test(textContent))) {
    //   currentNode.remove();
    //   return;
    // }

    // for the same reason, some text nodes should not be trimmed
    // just replacing tabs and new lines with spaces
    // and ignoring multiple adjacent spaces
    currentNode.textContent = textContent.replace(/[\t\n\r ]+/g, " ");

    currentNode = treeWalker.nextNode() as Text;
  }
  return document;
}

interface CitoidCacheData {
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
          };
          this.timestamp = new Date().toISOString();
          resolve(data);
        })
        .catch((reason) => {
          reject(reason);
        });
    });
  }
}

export { CitoidCache, HttpCache };
