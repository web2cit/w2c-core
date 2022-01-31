import { TargetUrl } from "../targetUrl";
import { TranslationProcedure } from "./procedure";
import { CitoidSelection } from "./selection";
import { JoinTransformation, RangeTransformation } from "./transformation";
import { fetchSimpleCitation, SimpleCitoidCitation } from "../citoid";

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

const sampleUrl = "https://example.com/article1";
const target = new TargetUrl(sampleUrl);
const citation: SimpleCitoidCitation = {
  itemType: "webpage",
  title: "Sample article",
  authorFirst: ["John", "Jane"],
  url: sampleUrl,
  tags: [],
};
mockFetchSimpleCitation.mockResolvedValue(citation);

it("", () => {
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
    expect(output.targetUrl).toBe(target);
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
