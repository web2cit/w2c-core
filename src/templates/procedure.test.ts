import { Webpage } from "../webpage";
import { TranslationProcedure } from "./procedure";
import { CitoidSelection } from "./selection";
import { JoinTransformation, RangeTransformation } from "./transformation";
import * as nodeFetch from "node-fetch";
import { pages } from "../samplePages";

const mockNodeFetch = nodeFetch as typeof import("../../__mocks__/node-fetch");

const sampleUrl = "https://example.com/article1";
const target = new Webpage(sampleUrl);

beforeEach(() => {
  mockNodeFetch.__addCitoidResponse(
    sampleUrl,
    JSON.stringify(pages[sampleUrl].citoid)
  );
});

it("applies a translation procedure", () => {
  const procedure = new TranslationProcedure();
  procedure.selections = [
    new CitoidSelection("title"),
    new CitoidSelection("authorFirst"),
  ];
  procedure.transformations = [
    new RangeTransformation(undefined, "1,2,0"),
    new JoinTransformation(),
  ];
  return procedure.translate(target).then((output) => {
    expect(output.target).toBe(target);
    expect(output.procedure).toBe(procedure);
    expect(output.output.selection).toEqual([
      ["Sample article"],
      ["John", "Jane"],
    ]);
    expect(output.output.transformation).toEqual([
      ["John", "Jane", "Sample article"],
      ["John,Jane,Sample article"],
    ]);
    expect(output.output.procedure).toEqual(["John,Jane,Sample article"]);
  });
});

it("returns empty output for empty procedure", () => {
  const procedure = new TranslationProcedure();
  return procedure.translate(target).then((output) => {
    expect(output.output.procedure).toEqual([]);
  });
});

it("returns selection output if no transformations", () => {
  const procedure = new TranslationProcedure();
  procedure.selections = [new CitoidSelection("itemType")];
  return procedure.translate(target).then((output) => {
    expect(output.output.procedure).toEqual(["webpage"]);
  });
});

it("does not return selection output if transformation output is an empty array", () => {
  const procedure = new TranslationProcedure();
  procedure.selections = [new CitoidSelection("itemType")];
  procedure.transformations = [new RangeTransformation(false, "10")];
  return procedure.translate(target).then((output) => {
    expect(output.output.procedure).toEqual([]);
  });
});

// empty procedure output should be invalid
