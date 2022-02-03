import { CitoidSelection } from "./selection";
import { SimpleCitoidCitation, fetchSimpleCitation } from "../citoid";
import { TargetUrl } from "../targetUrl";

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

describe("Citoid selection", () => {
  const sampleUrl = "https://example.com/article1";
  const sampleCitation: SimpleCitoidCitation = {
    itemType: "journalArticle",
    title: "Sample article",
    tags: ["tag 1", "tag 2"],
    url: sampleUrl,
    authorFirst: ["Name 1", "Name 2"],
    authorLast: ["Surname 1", "Surname 2"],
  };
  mockFetchSimpleCitation.mockResolvedValue(sampleCitation);
  const target = new TargetUrl(sampleUrl);
  const selection = new CitoidSelection();

  test("select existing fields", async () => {
    selection.config = "itemType";
    const itemType = await selection.select(target);
    expect(itemType).toEqual(["journalArticle"]);

    selection.config = "tags";
    const tags = await selection.select(target);
    expect(tags).toEqual(["tag 1", "tag 2"]);
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
