import { isDomainName } from "../utils";
import { HttpCache, CitoidCache } from "./caching";
import { DomainNameError } from "../errors";
import normalize from "path-normalize";

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

class WebpageFactory {
  private webpages: Map<string, Webpage> = new Map();
  readonly domain: string;

  constructor(domain: string) {
    if (!isDomainName(domain)) {
      throw new DomainNameError(domain);
    }
    this.domain = domain;
  }

  getWebpage(path: string): Webpage {
    path = normalize(path);
    if (path[0] !== "/") {
      throw new Error('Path must begin with "/"');
    }
    let webpage = this.webpages.get(path);
    if (webpage === undefined) {
      // this may fail if the user provided an invalid path string
      webpage = new Webpage("https://" + this.domain + path);
      this.webpages.set(path, webpage);
    }
    return webpage;
  }

  // exceptionally, we may want to import webpages from outside
  setWebpage(webpage: Webpage) {
    if (this.domain !== webpage.domain) {
      throw new Error(
        `Webpage domain "${webpage.domain}" does not match ` +
          `webpage factory domain "${this.domain}`
      );
    }
    const path = webpage.path;
    if (this.webpages.has(path)) {
      throw new Error(`We already have a webpage object for path "${path}"`);
    }
    this.webpages.set(path, webpage);
  }
}

export { Webpage, WebpageFactory };
