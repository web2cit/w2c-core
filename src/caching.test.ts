import { HttpCache, CitoidCache } from "./caching";
import { sampleCitation } from "./samples";
import * as nodeFetch from "node-fetch";

// TypeScript does not know that node-fetch has been mocked
// see https://stackoverflow.com/questions/53184529/typescript-doesnt-recognize-my-jest-mock-module
const mockNodeFetch = nodeFetch as typeof import("../__mocks__/node-fetch");

afterEach(() => {
  mockNodeFetch.__clearMockResponses();
});

// jest.mock("./citoid", () => {
//   const originalModule = jest.requireActual("./citoid");
//   return {
//     ...originalModule,
//     fetchSimpleCitation: jest.fn(),
//   };
// });
// const mockFetchSimpleCitation = fetchSimpleCitation as jest.MockedFunction<
//   typeof fetchSimpleCitation
// >;

describe("HTTP Cache", () => {
  test("create cache object", () => {
    const reqUrl = "https://diegodlh.conversodromo.com.ar/";
    const resBody = "test body";
    const resHeaders = [["test-header", "test-value"]];
    mockNodeFetch.__setMockResponse(reqUrl, resBody, {
      headers: resHeaders,
      url: reqUrl,
    });
    const cache = new HttpCache(reqUrl);
    expect(cache.url).toBe(reqUrl);
    return cache.getData().then((data) => {
      expect(data.body).toMatch(resBody);
      expect(data.headers.get(resHeaders[0][0])).toBe(resHeaders[0][1]);
    });
  });

  it("handles not-found error", async () => {
    const cache = new HttpCache("http://example.com");
    return expect(cache.getData()).rejects.toMatch("response status not ok");
  });
});

describe("Citoid Cache", () => {
  test("citoid cache refresh", () => {
    mockNodeFetch.__setMockResponse(
      // fixme: citoid url is not target url
      sampleCitation.url,
      JSON.stringify(sampleCitation)
    );
    const cache = new CitoidCache(sampleCitation.url);
    expect(cache.url).toBe(sampleCitation.url);

    return cache.fetchData().then((data) => {
      expect(data.citation).toStrictEqual(sampleCitation);
    });
  });
});
