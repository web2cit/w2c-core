jest.mock("node-fetch");

import { HttpCache, CitoidCache } from "./caching";
import {
  MediaWikiBaseFieldCitation,
  API_ENDPOINT as CITOID_ENDPOINT,
} from "./citoid";
import { Response } from "node-fetch";

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
    )) as typeof import("node-fetch") & // see https://stackoverflow.com/questions/53184529/typescript-doesnt-recognize-my-jest-mock-module // TypeScript does not know that node-fetch has been mocked
    { __setMockResponseMap: (responseMap: Map<string, Response>) => void };

    __setMockResponseMap(MOCK_RESPONSE_MAP);
  });

  test("create cache object", () => {
    const urlString = "https://diegodlh.conversodromo.com.ar/";
    const cache = new HttpCache(urlString);
    expect(cache.url).toBe(urlString);
    return cache.refresh().then(() => {
      expect(cache.body).toMatch("test body");
      expect(cache.headers.get("test-header")).toBe("test-value");
    });
  });
});

describe("Citoid Cache", () => {
  const MOCK_RESPONSE_MAP: Map<string, Response> = new Map();

  const sampleUrl = "https://example.com/article1";
  const sampleCitation: MediaWikiBaseFieldCitation = {
    key: "ABC",
    title: "Sample article",
    url: sampleUrl,
    tags: [],
    version: 0,
    itemType: "webpage",
  };
  MOCK_RESPONSE_MAP.set(
    [
      CITOID_ENDPOINT,
      "mediawiki-basefields",
      encodeURIComponent(sampleUrl),
    ].join("/"),
    new Response(JSON.stringify([sampleCitation]))
  );

  beforeEach(async () => {
    const { __setMockResponseMap } = (await import(
      "node-fetch"
    )) as typeof import("node-fetch") & {
      __setMockResponseMap: (responseMap: Map<string, Response>) => void;
    };

    __setMockResponseMap(MOCK_RESPONSE_MAP);
  });

  test("citoid cache refresh", () => {
    const cache = new CitoidCache(sampleUrl);
    expect(cache.url).toBe(sampleUrl);
    return cache.refresh().then(() => {
      expect(cache.citation).toStrictEqual(sampleCitation);
    });
  });
});
