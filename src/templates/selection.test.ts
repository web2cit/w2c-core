import {
  Selection,
  CitoidSelection,
  XPathSelection,
  SelectionConfigTypeError,
  UndefinedSelectionConfigError,
  FixedSelection,
} from "./selection";
import { Webpage } from "../webpage/webpage";
import * as nodeFetch from "node-fetch";
import { pages } from "../webpage/samplePages";

const mockNodeFetch = nodeFetch as typeof import("../../__mocks__/node-fetch");

beforeEach(() => {
  // emulate network error if no implementation given
  mockNodeFetch.__reset();
});

describe("XPath selection", () => {
  const sampleUrl = "https://example.com/article1";

  beforeEach(() => {
    mockNodeFetch.__addResponse(sampleUrl, pages[sampleUrl].html);
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
    mockNodeFetch.__addCitoidResponse(
      sampleUrl,
      JSON.stringify(pages[sampleUrl].citoid)
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

describe("Fixed selection", () => {
  it("returns a fixed value regardless of target", () => {
    const selection = Selection.create({
      type: "fixed",
      config: "fixed value",
    });
    const target = new Webpage("https://example.com/article");
    return selection
      .select(target)
      .then((value) => expect(value).toEqual(["fixed value"]));
  });

  it("fails on non-string configuration value", () => {
    const selection = new FixedSelection();
    expect(() => {
      selection.config = 0 as never;
    }).toThrow();
  });

  it("does not use any external resources", () => {
    const selection = new FixedSelection("fixed value");
    const target = new Webpage("https://example.com/article");
    const fetchSpy = jest.spyOn(mockNodeFetch, "default");
    selection.select(target);
    expect(fetchSpy).toHaveBeenCalledTimes(0);
  });

  it("accepts empty string as config", () => {
    const selection = Selection.create({ type: "fixed", config: "" });
    const target = new Webpage("https://example.com/article");
    return selection.select(target).then((value) => {
      expect(value).toEqual([""]);
    });
  });
});
