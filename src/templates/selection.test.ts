jest.mock("node-fetch");

import {
  CitoidSelection,
  XPathSelection,
  SelectionConfigTypeError,
  UndefinedSelectionConfigError,
} from "./selection";
import { SimpleCitoidCitation, fetchSimpleCitation } from "../citoid";
import { TargetUrl } from "../targetUrl";
import { Response } from "node-fetch";

jest.mock("../citoid", () => {
  const originalModule = jest.requireActual("../citoid");
  return {
    ...originalModule,
    fetchSimpleCitation: jest.fn(),
  };
});
const mockFetchSimpleCitation = fetchSimpleCitation as jest.MockedFunction<
  typeof fetchSimpleCitation
>;

describe("XPath selection", () => {
  const MOCK_RESPONSE_MAP: Map<string, Response> = new Map();
  const sampleUrl = "https://example.com/article1";
  const sampleHtml =
    "\
<!DOCTYPE html>\
<html>\
  <head></head>\
  <body>\
    <book author='Virginia Woolf'>\
    <title>Orlando</title>\
  </book>\
  <book author='James Gleick'>\
    <title>The Information</title>\
  </book>\
  </body>\
</html>\
  ";
  MOCK_RESPONSE_MAP.set(sampleUrl, new Response(sampleHtml));

  beforeEach(async () => {
    const { __setMockResponseMap } = (await import(
      "node-fetch"
    )) as typeof import("node-fetch") & {
      // see https://stackoverflow.com/questions/53184529/typescript-doesnt-recognize-my-jest-mock-module // TypeScript does not know that node-fetch has been mocked
      __setMockResponseMap: (responseMap: Map<string, Response>) => void;
    };

    __setMockResponseMap(MOCK_RESPONSE_MAP);
  });

  const target = new TargetUrl(sampleUrl);

  test("fails selection if configuration unset", () => {
    const selection = new XPathSelection();
    expect(() => {
      selection.select(target);
    }).toThrow(UndefinedSelectionConfigError);
  });

  test("selects an HTML element node", () => {
    const selection = new XPathSelection("//book[@author='Virginia Woolf']");
    return expect(selection.select(target)).resolves.toEqual(["Orlando"]);
  });

  test("selects multiple HTML element nodes", () => {
    const selection = new XPathSelection("//title");
    return expect(selection.select(target)).resolves.toEqual([
      "Orlando",
      "The Information",
    ]);
  });

  test("selects an attribute node", async () => {
    const selection = new XPathSelection("//book[2]/@author");
    return expect(selection.select(target)).resolves.toEqual(["James Gleick"]);
  });

  test("selects a text node", async () => {
    const selection = new XPathSelection("//book[2]//text()");
    expect(await selection.select(target)).toEqual(["The Information"]);
  });

  test("handles a string result", async () => {
    const selection = new XPathSelection();
    selection.config = "string(//title)";
    // If the object is a node-set, the string value of the first node in the set is returned.
    // see https://developer.mozilla.org/en-US/docs/Web/XPath/Functions/string
    expect(await selection.select(target)).toEqual(["Orlando"]);
  });

  test("handles a number result", async () => {
    const selection = new XPathSelection();
    selection.config = "count(//book)";
    expect(await selection.select(target)).toEqual(["2"]);
  });

  test("handles a boolean result", async () => {
    const selection = new XPathSelection();
    selection.config = "//title[1]//text() = 'Orlando'";
    expect(await selection.select(target)).toEqual(["true"]);
  });

  test("rejects wrong expression", () => {
    const selection = new XPathSelection();
    expect(() => {
      selection.config = "||";
    }).toThrow(SelectionConfigTypeError);
  });
});

describe("Citoid selection", () => {
  const sampleUrl = "https://example.com/article1";
  const sampleCitation: SimpleCitoidCitation = {
    itemType: "journalArticle",
    title: "Sample article",
    tags: ["tag 1", "tag 2"],
    url: sampleUrl,
    authorFirst: ["Name 1", "Name 2"],
    authorLast: ["Surname 1", "Surname 2"],
  };
  mockFetchSimpleCitation.mockResolvedValue(sampleCitation);
  const target = new TargetUrl(sampleUrl);
  const selection = new CitoidSelection();

  test("select existing fields", async () => {
    selection.config = "itemType";
    const itemType = await selection.select(target);
    expect(itemType).toEqual(["journalArticle"]);

    selection.config = "tags";
    const tags = await selection.select(target);
    expect(tags).toEqual(["tag 1", "tag 2"]);
  });

  test("select undefined fields", async () => {
    selection.config = "DOI";
    const doi = await selection.select(target);
    expect(doi).toEqual([]);
  });

  test("select invalid fields", async () => {
    expect(() => {
      selection.config = "invalidField";
    }).toThrow(SelectionConfigTypeError);
  });
});
