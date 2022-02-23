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
