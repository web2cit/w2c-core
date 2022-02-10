import { Response } from "node-fetch";
import {
  API_ENDPOINT,
  MediaWikiBaseFieldCitation,
  fetchSimpleCitation,
} from "./citoid";

describe("Simple Citoid citation", () => {
  const MOCK_RESPONSE_MAP: Map<string, Response> = new Map();

  const sampleUrl = "https://example.com/article1";
  const sampleCitation: MediaWikiBaseFieldCitation = {
    key: "ABC",
    title: "Sample article",
    url: sampleUrl,
    tags: [
      {
        tag: "first tag",
        type: 1,
      },
      {
        tag: "second tag",
        type: 1,
      },
    ],
    version: 0,
    itemType: "webpage",
  };
  MOCK_RESPONSE_MAP.set(
    [API_ENDPOINT, "mediawiki-basefields", encodeURIComponent(sampleUrl)].join(
      "/"
    ),
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

  test("fetch and convert", () => {
    return fetchSimpleCitation(sampleUrl).then((citation) => {
      expect(citation).toStrictEqual({
        itemType: "webpage",
        title: "Sample article",
        tags: ["first tag", "second tag"],
        url: sampleUrl,
      });
    });
  });
});

// todo: implement
it("handles ok response with unexpected data format", () => {
  expect(false).toBe(true);
});
