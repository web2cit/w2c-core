import { HttpCache, CitoidCache } from "./caching";

class Webpage {
  domain: string;
  path: string;
  url: URL;
  cache: {
    http: HttpCache;
    citoid: CitoidCache;
  };

  constructor(urlString: string) {
    let url: URL;
    try {
      url = new URL(urlString);
    } catch (e) {
      if (e instanceof TypeError && e.message === "Invalid URL") {
        throw new Error(`"${urlString}" is not a valid URL!`);
      } else {
        throw e;
      }
    }
    // The Webpage object's URL is set to that with which the object was instantiated.
    // We may consider changing it in case of redirects, or if a canonical URL
    // is available.
    // However, there may be cases where we may not want to do that (see T210871)
    this.url = url;
    this.domain = url.hostname;
    this.path = url.pathname + url.search;
    this.cache = {
      http: new HttpCache(urlString),
      citoid: new CitoidCache(urlString),
    };
  }
}

export { Webpage };
