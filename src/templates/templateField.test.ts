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
    const field = new TemplateField("itemType", true);
    return field.translate(target).then((output) => {
      expect(output.output).toEqual(["webpage"]);
      expect(output.valid).toBe(true);
      expect(output.applicable).toBe(true);
    });
  });
  test("title template field", () => {
    const field = new TemplateField("title", true);
    return field.translate(target).then((output) => {
      expect(output.output).toEqual(["Sample article"]);
      expect(output.valid).toBe(true);
      expect(output.applicable).toBe(true);
    });
  });
  test("authorFirst template field", () => {
    const field = new TemplateField("authorFirst", true);
    return field.translate(target).then((output) => {
      expect(output.output).toEqual(["John", "Jane", ""]);
      expect(output.valid).toBe(true);
      expect(output.applicable).toBe(true);
    });
  });
  test("authorLast template field", () => {
    const field = new TemplateField("authorLast", true);
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
    const field = new TemplateField("date", true);
    return field.translate(target).then((output) => {
      expect(output.output).toEqual(["2022-02-04"]);
      expect(output.valid).toBe(true);
      expect(output.applicable).toBe(true);
    });
  });
  test("source template field", () => {
    const field = new TemplateField("source", true);
    return field.translate(target).then((output) => {
      expect(output.output).toEqual(
        ["Journal title"] // default transformation keeps first item
      );
      expect(output.valid).toBe(true);
      expect(output.applicable).toBe(true);
    });
  });
  test("language template field", () => {
    const field = new TemplateField("language", true);
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
            value: "itemType",
          },
        ],
        transformations: [
          {
            type: "range",
            value: "10", // should return an empty step output
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
