import { HttpCache, CitoidCache } from "./caching";
import { pages } from "./samplePages";
import fetch, * as nodeFetch from "node-fetch";
import { JSDOM } from "jsdom";

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
const mockNodeFetch = nodeFetch as typeof import("../../__mocks__/node-fetch");

beforeAll(() => {
  // the caching module relies on there being a windowContext global object,
  // set up by the Domain constructor
  globalThis.windowContext = new JSDOM().window;
});

beforeEach(() => {
  mockNodeFetch.__reset();
});

describe("HTTP Cache", () => {
  const url = "https://example.com/article1";
  test("create cache object", () => {
    mockNodeFetch.__addResponse(url, "test body", {
      headers: [["test-header", "test-value"]],
    });
    const cache = new HttpCache(url);
    expect(cache.url).toBe(url);
    return cache.getData().then((data) => {
      expect(data.body).toMatch("test body");
      expect(data.headers.get("test-header")).toBe("test-value");
    });
  });

  it("handles not-found error", async () => {
    const cache = new HttpCache(url);
    return expect(cache.getData()).rejects.toThrow("HTTP Error Response");
  });

  it("handles network error", () => {
    mockNodeFetch.__disconnect();
    const cache = new HttpCache(url);
    return expect(cache.getData()).rejects.toThrow(Error);
  });
});

describe("Citoid Cache", () => {
  const url = "https://example.com/article1";
  test("citoid cache refresh", () => {
    mockNodeFetch.__addCitoidResponse(url, JSON.stringify(pages[url].citoid));
    const cache = new CitoidCache(url);
    expect(cache.url).toBe(url);

    return cache.fetchData().then((data) => {
      expect(data.citation.simple).toEqual({
        itemType: "webpage",
        title: "Sample article",
        tags: ["first tag", "second tag"],
        url: "https://example.com/article1",
        authorFirst: ["John", "Jane"],
        authorLast: ["Doe", "Smith"],
      });
    });
  });
});
