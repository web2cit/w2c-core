jest.mock("node-fetch");

import { HttpCache } from "./caching";
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
    )) as typeof import("node-fetch") & // TypeScript does not know that node-fetch has been mocked
    // see https://stackoverflow.com/questions/53184529/typescript-doesnt-recognize-my-jest-mock-module
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
