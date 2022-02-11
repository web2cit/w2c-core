import {
  CitoidSelection,
  XPathSelection,
  SelectionConfigTypeError,
  UndefinedSelectionConfigError,
} from "./selection";
import { Webpage } from "../webpage";
import fetch from "node-fetch";
import { __getImplementation } from "../../__mocks__/node-fetch";
import { pages } from "../samplePages";

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

beforeEach(() => {
  // emulate network error if no implementation given
  mockFetch.mockImplementation(() => Promise.reject(new Error()));
});

describe("XPath selection", () => {
  const sampleUrl = "https://example.com/article1";

  beforeEach(async () => {
    mockFetch.mockImplementation(__getImplementation(pages[sampleUrl].html));
  });

  const target = new Webpage(sampleUrl);

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
  const target = new Webpage(sampleUrl);
  const selection = new CitoidSelection();

  beforeEach(() => {
    mockFetch.mockImplementation(
      __getImplementation(JSON.stringify(pages[sampleUrl].citoid))
    );
  });

  test("select existing fields", async () => {
    selection.config = "itemType";
    const itemType = await selection.select(target);
    expect(itemType).toEqual(["webpage"]);

    selection.config = "tags";
    const tags = await selection.select(target);
    expect(tags).toEqual(["first tag", "second tag"]);
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
