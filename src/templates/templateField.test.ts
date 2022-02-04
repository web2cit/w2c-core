import { fetchSimpleCitation, SimpleCitoidCitation } from "../citoid";
import { TargetUrl } from "../targetUrl";
import { TemplateField } from "./templateField";

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
  authorFirst: ["John", "Jane", ""],
  authorLast: ["Smith", "Doe", "University of Somewhere"],
  date: ["2022-02-04"],
  publicationTitle: ["Journal title"],
  publisher: ["Journal publisher"],
  url: sampleUrl,
  tags: [],
};
mockFetchSimpleCitation.mockResolvedValue(citation);

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
