import { HttpCache, CitoidCache } from "./caching";
import { pages } from "./samplePages";
import fetch from "node-fetch";
import { __getImplementation } from "../__mocks__/node-fetch";

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

beforeEach(() => {
  // emulate network error if no implementation given
  mockFetch.mockImplementation(() => Promise.reject(new Error()));
});

describe("HTTP Cache", () => {
  const url = "https://example.com/article1";
  test("create cache object", () => {
    const resBody = "test body";
    const resHeaders = [["test-header", "test-value"]];
    mockFetch.mockImplementation(
      __getImplementation(resBody, {
        headers: resHeaders,
      })
    );
    const cache = new HttpCache(url);
    expect(cache.url).toBe(url);
    return cache.getData().then((data) => {
      expect(data.body).toMatch(resBody);
      expect(data.headers.get(resHeaders[0][0])).toBe(resHeaders[0][1]);
    });
  });

  it("handles not-found error", async () => {
    mockFetch.mockImplementation(
      __getImplementation(undefined, { status: 404 })
    );
    const cache = new HttpCache(url);
    return expect(cache.getData()).rejects.toMatch("response status not ok");
  });

  it("handles network error", () => {
    const cache = new HttpCache(url);
    return expect(cache.getData()).rejects.toThrow(Error);
  });
});

describe("Citoid Cache", () => {
  const url = "https://example.com/article1";
  test("citoid cache refresh", () => {
    mockFetch.mockImplementation(
      __getImplementation(JSON.stringify(pages[url].citoid))
    );
    const cache = new CitoidCache(url);
    expect(cache.url).toBe(url);

    return cache.fetchData().then((data) => {
      expect(data.citation).toStrictEqual({
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
