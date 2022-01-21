import fetch from "node-fetch";
import { HttpCache, CitoidCache } from "./caching";

class TargetUrl {
  domain: string;
  path: string;
  cache: {
    http: HttpCache;
    citoid: CitoidCache;
  };

  constructor(urlString: string) {
    const url = new URL(urlString);
    this.domain = url.hostname;
    this.path = url.pathname + url.search;
    this.cache = {
      http: new HttpCache(urlString),
      citoid: new CitoidCache(urlString),
    };
  }
}

export { TargetUrl };
