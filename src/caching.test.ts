jest.mock("node-fetch");

import { HttpCache, CitoidCache } from "./caching";
import { fetchSimpleCitation, SimpleCitoidCitation } from "./citoid";
import { Response } from "node-fetch";

jest.mock("./citoid", () => {
  const originalModule = jest.requireActual("./citoid");
  return {
    ...originalModule,
    fetchSimpleCitation: jest.fn(),
  };
});
const mockFetchSimpleCitation = fetchSimpleCitation as jest.MockedFunction<
  typeof fetchSimpleCitation
>;

describe("HTTP Cache", () => {
  const MOCK_RESPONSE_MAP: Map<string, Response> = new Map();
  MOCK_RESPONSE_MAP.set(
    "https://diegodlh.conversodromo.com.ar/",
    new Response("test body", {
      headers: [["test-header", "test-value"]],
    })
  );

  beforeEach(async () => {
    const { __setMockResponseMap } = (await import(
      "node-fetch"
    )) as typeof import("node-fetch") & {
      // see https://stackoverflow.com/questions/53184529/typescript-doesnt-recognize-my-jest-mock-module // TypeScript does not know that node-fetch has been mocked
      __setMockResponseMap: (responseMap: Map<string, Response>) => void;
    };

    __setMockResponseMap(MOCK_RESPONSE_MAP);
  });

  test("create cache object", () => {
    const urlString = "https://diegodlh.conversodromo.com.ar/";
    const cache = new HttpCache(urlString);
    expect(cache.url).toBe(urlString);
    return cache.getData().then((data) => {
      expect(data.body).toMatch("test body");
      expect(data.headers.get("test-header")).toBe("test-value");
    });
  });
});

describe("Citoid Cache", () => {
  const sampleUrl = "https://example.com/article1";
  const sampleCitation: SimpleCitoidCitation = {
    itemType: "webpage",
    title: "Sample article",
    tags: ["first tag", "second tag"],
    url: sampleUrl,
    authorFirst: ["John", "Jane"],
    authorLast: ["Doe", "Smith"],
  };
  test("citoid cache refresh", () => {
    const cache = new CitoidCache(sampleUrl);
    expect(cache.url).toBe(sampleUrl);

    mockFetchSimpleCitation.mockResolvedValue(sampleCitation);

    return cache.fetchData().then((data) => {
      expect(data.citation).toStrictEqual(sampleCitation);
    });
  });
});
