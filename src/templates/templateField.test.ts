import { Webpage } from "../webpage";
import { TemplateField } from "./templateField";
import * as nodeFetch from "node-fetch";
import { pages } from "../samplePages";

const mockNodeFetch = nodeFetch as typeof import("../../__mocks__/node-fetch");

const sampleUrl = "https://example.com/article2";
const target = new Webpage(sampleUrl);

beforeEach(() => {
  mockNodeFetch.__addCitoidResponse(
    sampleUrl,
    JSON.stringify(pages[sampleUrl].citoid)
  );
});

describe("Use default procedures", () => {
  test("itemType template field", () => {
    const field = new TemplateField("itemType");
    return field.translate(target).then((output) => {
      expect(output.output).toEqual(["webpage"]);
      expect(output.valid).toBe(true);
      expect(output.applicable).toBe(true);
    });
  });
  test("title template field", () => {
    const field = new TemplateField("title");
    return field.translate(target).then((output) => {
      expect(output.output).toEqual(["Sample article"]);
      expect(output.valid).toBe(true);
      expect(output.applicable).toBe(true);
    });
  });
  test("authorFirst template field", () => {
    const field = new TemplateField("authorFirst");
    return field.translate(target).then((output) => {
      expect(output.output).toEqual(["John", "Jane", ""]);
      expect(output.valid).toBe(true);
      expect(output.applicable).toBe(true);
    });
  });
  test("authorLast template field", () => {
    const field = new TemplateField("authorLast");
    return field.translate(target).then((output) => {
      expect(output.output).toEqual([
        "Smith",
        "Doe",
        "University of Somewhere",
      ]);
      expect(output.valid).toBe(true);
      expect(output.applicable).toBe(true);
    });
  });
  test("date template field", () => {
    const field = new TemplateField("date");
    return field.translate(target).then((output) => {
      expect(output.output).toEqual(["2022-02-04"]);
      expect(output.valid).toBe(true);
      expect(output.applicable).toBe(true);
    });
  });
  test("source template field", () => {
    const field = new TemplateField("source");
    return field.translate(target).then((output) => {
      expect(output.output).toEqual(
        ["Journal title"] // default transformation keeps first item
      );
      expect(output.valid).toBe(true);
      expect(output.applicable).toBe(true);
    });
  });
  test("language template field", () => {
    const field = new TemplateField("language");
    return field.translate(target).then((output) => {
      expect(output.output).toEqual([null]);
      expect(output.valid).toBe(false);
      expect(output.applicable).toBe(true);
    });
  });
});
