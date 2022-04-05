import { Webpage } from "../webpage/webpage";
import { TemplateField } from "./templateField";
import * as nodeFetch from "node-fetch";
import { pages } from "../webpage/samplePages";
import log from "loglevel";
import { TemplateFieldDefinition } from "../types";

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
  const loadDefaults = true;
  test("itemType template field", () => {
    const field = new TemplateField("itemType", { loadDefaults });
    return field.translate(target).then((output) => {
      expect(output.output).toEqual(["webpage"]);
      expect(output.valid).toBe(true);
      expect(output.applicable).toBe(true);
    });
  });
  test("title template field", () => {
    const field = new TemplateField("title", { loadDefaults });
    return field.translate(target).then((output) => {
      expect(output.output).toEqual(["Sample article"]);
      expect(output.valid).toBe(true);
      expect(output.applicable).toBe(true);
    });
  });
  test("authorFirst template field", () => {
    const field = new TemplateField("authorFirst", { loadDefaults });
    return field.translate(target).then((output) => {
      expect(output.output).toEqual(["John", "Jane", ""]);
      expect(output.valid).toBe(true);
      expect(output.applicable).toBe(true);
    });
  });
  test("authorLast template field", () => {
    const field = new TemplateField("authorLast", { loadDefaults });
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
    const field = new TemplateField("date", { loadDefaults });
    return field.translate(target).then((output) => {
      expect(output.output).toEqual(["2022-02-04"]);
      expect(output.valid).toBe(true);
      expect(output.applicable).toBe(true);
    });
  });
  test("publishedIn template field", () => {
    const field = new TemplateField("publishedIn", { loadDefaults });
    return field.translate(target).then((output) => {
      expect(output.output).toEqual(["Journal title"]);
      expect(output.valid).toBe(true);
      expect(output.applicable).toBe(true);
    });
  });
  test("publishedby template field", () => {
    const field = new TemplateField("publishedBy", { loadDefaults });
    return field.translate(target).then((output) => {
      expect(output.output).toEqual(["Journal publisher"]);
      expect(output.valid).toBe(true);
      expect(output.applicable).toBe(true);
    });
  });
  test("language template field", () => {
    const field = new TemplateField("language", { loadDefaults });
    return field.translate(target).then((output) => {
      expect(output.output).toEqual([]);
      expect(output.valid).toBe(false);
      expect(output.applicable).toBe(true);
    });
  });
});

it("marks empty outputs as invalid", async () => {
  const templateField = new TemplateField({
    fieldname: "itemType",
    required: true,
    procedures: [
      {
        selections: [
          {
            type: "citoid",
            config: "itemType",
          },
        ],
        transformations: [
          {
            type: "range",
            config: "10", // should return an empty step output
            itemwise: false,
          },
        ],
      },
    ],
  });
  const fieldOutput = await templateField.translate(target);
  expect(fieldOutput.output).toEqual([]);
  expect(fieldOutput.valid).toBe(false);
});

it("always returns field output, even if invalid", async () => {
  const field = new TemplateField({
    fieldname: "itemType",
    required: true,
    procedures: [
      {
        selections: [{ type: "fixed", config: "invalidType" }],
        transformations: [],
      },
    ],
  });
  const target = new Webpage("https://example.com/target");
  const output = await field.translate(target);
  expect(output.output).toEqual(["invalidType"]);
  expect(output.valid).toBe(false);
});

it("constructor optionally skips invalid procedure definitions", () => {
  const warnSpy = jest.spyOn(log, "warn").mockImplementation();
  const definition: unknown = {
    fieldname: "itemType",
    required: true,
    procedures: [
      {
        selections: [],
        transformations: [],
      },
      {
        selections: [],
      },
      {
        transformations: [],
      },
    ],
  };
  const field = new TemplateField(definition as TemplateFieldDefinition, {
    strict: false,
  });
  expect(warnSpy).toHaveBeenCalledTimes(2);
  expect(field.toJSON()).toEqual({
    fieldname: "itemType",
    required: true,
    procedures: [
      {
        selections: [],
        transformations: [],
      },
    ],
  });
  expect(() => {
    new TemplateField(definition as TemplateFieldDefinition);
  }).toThrow();
});
