import fetch from "node-fetch";

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
  }

  refreshHttp() {
    // asynchronously update the http cache
    // should it return something?
    // how would the user know its status? loading, done, failed
  }

  refreshCitoid() {
    //
  }
}

export { TargetUrl };
