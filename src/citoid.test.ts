import { fetchSimpleCitation } from "./citoid";
import * as nodeFetch from "node-fetch";
import { pages } from "./webpage/samplePages";

const mockNodeFetch = nodeFetch as typeof import("../__mocks__/node-fetch");

beforeEach(() => {
  mockNodeFetch.__reset();
});

describe("Simple Citoid citation", () => {
  const sampleUrl = "https://example.com/article1";

  test("fetch and convert", () => {
    mockNodeFetch.__addCitoidResponse(
      sampleUrl,
      JSON.stringify(pages[sampleUrl].citoid)
    );
    return fetchSimpleCitation(sampleUrl).then((citation) => {
      expect(citation).toStrictEqual({
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

describe("Error responses", () => {
  const url = "https://example.com/";

  it("handles a successful non-JSON response", () => {
    mockNodeFetch.__addCitoidResponse(url, "unexpected response format");
    return expect(fetchSimpleCitation(url)).rejects.toThrow(
      "Unknown Citoid response format"
    );
  });

  it("handles a successful unknown JSON response", () => {
    const wrongCitation = { invalidKey: "invalidValue" };
    mockNodeFetch.__addCitoidResponse(url, JSON.stringify([wrongCitation]));
    return expect(fetchSimpleCitation(url)).rejects.toThrow(
      "Unknown Citoid response format"
    );
  });
});

it("accepts basic Citoid citation with required fields only", async () => {
  const basicCitation = {
    itemType: "journalArticle",
    title: "sample title",
    url: "https://example.com/",
  };
  mockNodeFetch.__setDefaultResponse(JSON.stringify([basicCitation]));
  const citation = await fetchSimpleCitation("https://example.com/");
  expect(citation).toEqual({
    itemType: "journalArticle",
    title: "sample title",
    url: "https://example.com/",
  });
});
