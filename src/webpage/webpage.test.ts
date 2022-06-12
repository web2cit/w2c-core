import { Webpage, WebpageFactory } from "./webpage";
import { DomainNameError } from "../errors";

describe("Good URL", () => {
  const urlString = "https://www.abc.example.com/path/to/route?abc=123&def=234";
  const url = new Webpage(urlString);

  it("isolates the domain", () => {
    expect(url.domain).toBe("www.abc.example.com");
  });

  it("isolates the path and query string", () => {
    expect(url.path).toBe("/path/to/route?abc=123&def=234");
  });
});

describe("Webpage factory", () => {
  it("rejects invalid domains", () => {
    expect(() => {
      new WebpageFactory("example.com/invalid/domain");
    }).toThrow(DomainNameError);
  });

  it("creates new webpage object", () => {
    const factory = new WebpageFactory("example.com");
    const webpage = factory.getWebpage("/some/path");
    expect(webpage.domain).toBe("example.com");
    expect(webpage.path).toBe("/some/path");
  });

  it("reuses previously created webpage object", () => {
    const factory = new WebpageFactory("example.com");
    const webpage1 = factory.getWebpage("/some/path");
    const webpage2 = factory.getWebpage("/some/path");
    expect(webpage1 === webpage2).toBe(true);
  });

  it("saves a webpage provided externally", () => {
    const factory = new WebpageFactory("example.com");
    const webpage = new Webpage("https://example.com/some/path");
    factory.setWebpage(webpage);
    expect(factory.getWebpage(webpage.path) === webpage).toBe(true);
  });

  it("rejects external webpage from another domain", () => {
    const factory = new WebpageFactory("example.com");
    const webpage = new Webpage("https://other.example.com/some/path");
    expect(() => {
      factory.setWebpage(webpage);
    }).toThrow("does not match webpage factory domain");
  });

  it("rejects external webpage for already stored path", () => {
    const factory = new WebpageFactory("example.com");
    factory.getWebpage("/some/path");
    const webpage = new Webpage("https://example.com/some/path");
    expect(() => {
      factory.setWebpage(webpage);
    }).toThrow("We already have a webpage object for path");
  });

  it("rejects paths without leading slash", () => {
    const factory = new WebpageFactory("example.com");
    expect(() => {
      factory.getWebpage("some/path");
    }).toThrow();
  });
});
