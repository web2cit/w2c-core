import {
  Selection,
  CitoidSelection,
  XPathSelection,
  SelectionConfigTypeError,
  UndefinedSelectionConfigError,
  FixedSelection,
  JsonLdSelection,
} from "./selection";
import { Webpage } from "../webpage/webpage";
import * as nodeFetch from "node-fetch";
import { pages } from "../webpage/samplePages";
import { JSDOM } from "jsdom";
import log from "loglevel";

const mockNodeFetch = nodeFetch as typeof import("../../__mocks__/node-fetch");

beforeAll(() => {
  // xpath and json-ld selections rely on there being a windowContext global
  // object, set up by the Domain constructor
  globalThis.windowContext = new JSDOM().window;
});

beforeEach(() => {
  // emulate network error if no implementation given
  mockNodeFetch.__reset();
});

describe("XPath selection", () => {
  const sampleUrl = "https://example.com/article1";

  let target: Webpage;
  beforeEach(() => {
    mockNodeFetch.__addResponse(sampleUrl, pages[sampleUrl].html);
    target = new Webpage(sampleUrl);
  });

  test("fails selection if configuration unset", () => {
    const selection = new XPathSelection();
    return expect(selection.apply(target)).rejects.toThrow(
      UndefinedSelectionConfigError
    );
  });

  test("selects an HTML element node", () => {
    const selection = new XPathSelection("//book[@author='Virginia Woolf']");
    return expect(selection.apply(target)).resolves.toEqual(["Orlando"]);
  });

  test("selects multiple HTML element nodes", () => {
    const selection = new XPathSelection("//title");
    return expect(selection.apply(target)).resolves.toEqual([
      "Orlando",
      "The Information",
    ]);
  });

  test("selects an attribute node", async () => {
    const selection = new XPathSelection("//book[2]/@author");
    return expect(selection.apply(target)).resolves.toEqual(["James Gleick"]);
  });

  test("correctly identifies HTML element with 'value' attribute (T311925)", () => {
    const selection = new XPathSelection("//button");
    return expect(selection.apply(target)).resolves.toEqual(["Button label"]);
  });

  test("selects a text node", async () => {
    const selection = new XPathSelection("//book[2]//text()");
    expect(await selection.apply(target)).toEqual(["The Information"]);
  });

  test("handles a string result", async () => {
    const selection = new XPathSelection();
    selection.config = "string(//title)";
    // If the object is a node-set, the string value of the first node in the set is returned.
    // see https://developer.mozilla.org/en-US/docs/Web/XPath/Functions/string
    expect(await selection.apply(target)).toEqual(["Orlando"]);
  });

  test("handles a number result", async () => {
    const selection = new XPathSelection();
    selection.config = "count(//book)";
    expect(await selection.apply(target)).toEqual(["2"]);
  });

  test("handles a boolean result", async () => {
    const selection = new XPathSelection();
    selection.config = "//title[1]//text() = 'Orlando'";
    expect(await selection.apply(target)).toEqual(["true"]);
  });

  test("rejects wrong expression", () => {
    const selection = new XPathSelection();
    expect(() => {
      selection.config = "||";
    }).toThrow(SelectionConfigTypeError);
  });

  test("rejects XPath v3.1 expression (T308666)", () => {
    const selection = new XPathSelection();
    const expression = './/*[contains-token(@class, "byline__name")]//a';
    expect(() => {
      selection.config = expression;
    }).toThrow(SelectionConfigTypeError);
  });

  test("constructor rejects empty-string configuration value", () => {
    expect(() => {
      new XPathSelection("");
    }).toThrow(SelectionConfigTypeError);
  });

  test("returns empty output on step application error (T305163)", async () => {
    const warnSpy = jest.spyOn(log, "warn").mockImplementation();
    const selection = new XPathSelection("//book[@author='Virginia Woolf']");
    // simulate disconnection to cause a step application error
    mockNodeFetch.__disconnect();
    const output = await selection.apply(target);
    expect(warnSpy).toHaveBeenCalled();
    expect(output).toEqual([]);
  });
});

describe("Citoid selection", () => {
  const sampleUrl = "https://example.com/article1";
  const selection = new CitoidSelection();

  let target: Webpage;
  beforeEach(() => {
    mockNodeFetch.__addCitoidResponse(
      sampleUrl,
      JSON.stringify(pages[sampleUrl].citoid)
    );
    target = new Webpage(sampleUrl);
  });

  test("select existing fields", async () => {
    selection.config = "itemType";
    const itemType = await selection.apply(target);
    expect(itemType).toEqual(["webpage"]);

    selection.config = "tags";
    const tags = await selection.apply(target);
    expect(tags).toEqual(["first tag", "second tag"]);
  });

  test("select undefined fields", async () => {
    selection.config = "DOI";
    const doi = await selection.apply(target);
    expect(doi).toEqual([]);
  });

  test("select invalid fields", async () => {
    expect(() => {
      selection.config = "invalidField";
    }).toThrow(SelectionConfigTypeError);
  });

  test("constructor rejects empty-string configuration", async () => {
    expect(() => {
      new CitoidSelection("");
    }).toThrow(SelectionConfigTypeError);
  });

  test("returns empty output on step application error (T305163)", async () => {
    const warnSpy = jest.spyOn(log, "warn").mockImplementation();
    selection.config = "itemType";
    // simulate disconnection to cause a step application error
    mockNodeFetch.__disconnect();
    const output = await selection.apply(target);
    expect(output).toEqual([]);
    expect(warnSpy).toHaveBeenCalled();
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
      .apply(target)
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
    selection.apply(target);
    expect(fetchSpy).toHaveBeenCalledTimes(0);
  });

  it("accepts empty string as config", () => {
    const selection = Selection.create({ type: "fixed", config: "" });
    const target = new Webpage("https://example.com/article");
    return selection.apply(target).then((value) => {
      expect(value).toEqual([""]);
    });
  });
});

describe("JSON-LD selection", () => {
  const url = "https://example.com/article1";

  let target: Webpage;
  beforeEach(() => {
    mockNodeFetch.__addResponse(url, pages[url].html);
    target = new Webpage(url);
  });

  test("fails selection if configuration unset", () => {
    const selection = new JsonLdSelection();
    return expect(selection.apply(target)).rejects.toThrow(
      UndefinedSelectionConfigError
    );
  });

  test("select single value", () => {
    // const expression = "$[0].name"  // JSONPath
    const expression = "[0].name"; // JMESPath
    const selection = new JsonLdSelection(expression);
    return expect(selection.apply(target)).resolves.toEqual(["Jane Doe"]);
  });

  test("select multiple values", () => {
    // const expression = "$[0][name,jobTitle]"  // JSONPath
    const expression = "[0].[name,jobTitle]"; // JMESPath
    const selection = new JsonLdSelection(expression);
    return expect(selection.apply(target)).resolves.toEqual([
      "Jane Doe",
      "Professor",
    ]);
  });

  test("select value from additional json-ld object", () => {
    // const expression = "$[1].store.bicycle.color"  // JSONPath
    const expression = "[1].store.bicycle.color"; // JMESPath
    const selection = new JsonLdSelection(expression);
    return expect(selection.apply(target)).resolves.toEqual(["red"]);
  });

  test("json-stringify returned values", () => {
    // const expression = "$[1].store.bicycle"  // JSONPath
    const expression = "[1].store.bicycle"; // JMESPath
    const selection = new JsonLdSelection(expression);
    return expect(selection.apply(target)).resolves.toEqual([
      '{"color":"red","price":19.95}',
    ]);
  });

  test("flatten returned array of results", async () => {
    // const expression = "$[1].store.book"  // JSONPath
    const expression = "[1].store.book"; // JMESPath
    const selection = new JsonLdSelection(expression);
    const output = await selection.apply(target);
    expect(output.length).toBe(4);
  });

  test("rejects invalid expressions", () => {
    const expression = "$0].name";
    const selection = new JsonLdSelection();
    expect(() => {
      selection.config = expression;
    }).toThrow(SelectionConfigTypeError);
  });

  test("ignores null values", () => {
    const expression = "[0].[name, lastName, email]";
    const selection = new JsonLdSelection(expression);
    return expect(selection.apply(target)).resolves.toEqual(["Jane Doe"]);
  });

  test("handles unescaped control characters (T318336)", () => {
    const expression = "[].stringWithUnescapedControlCharacters";
    const selection = new JsonLdSelection(expression);
    return expect(selection.apply(target)).resolves.toEqual([
      "unescaped control characters",
    ]);
  });
});
