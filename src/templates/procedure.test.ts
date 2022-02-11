import { Webpage } from "../webpage";
import { TranslationProcedure } from "./procedure";
import { CitoidSelection } from "./selection";
import { JoinTransformation, RangeTransformation } from "./transformation";
import fetch from "node-fetch";
import { __getImplementation } from "../../__mocks__/node-fetch";
import { pages } from "../samplePages";

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

const sampleUrl = "https://example.com/article1";
const target = new Webpage(sampleUrl);

beforeEach(() => {
  mockFetch.mockImplementation(
    __getImplementation(JSON.stringify(pages[sampleUrl].citoid))
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

// empty selection output should give empty transformation output

// empty procedure output should be invalid
