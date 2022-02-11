import { fetchSimpleCitation } from "./citoid";
import fetch from "node-fetch";
import { __getImplementation } from "../__mocks__/node-fetch";
import { sampleCitations } from "./samples";

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

beforeEach(() => {
  // emulate network error if no implementation given
  mockFetch.mockImplementation(() => Promise.reject(new Error()));
});

describe("Simple Citoid citation", () => {
  const sampleUrl = "https://example.com/article1";
  const { citoid: citoidCitation, simple: simpleCitation } = sampleCitations[0];

  test("fetch and convert", () => {
    mockFetch.mockImplementation(
      __getImplementation(JSON.stringify([citoidCitation]))
    );
    return fetchSimpleCitation(sampleUrl).then((citation) => {
      expect(citation).toStrictEqual(simpleCitation);
    });
  });
});

describe("Error responses", () => {
  const url = "https://example.com/";

  it("handles a successful non-JSON response", () => {
    mockFetch.mockImplementation(
      __getImplementation("unexpected response format")
    );
    return expect(fetchSimpleCitation(url)).rejects.toThrow(
      "Unknown Citoid response format"
    );
  });

  it("handles a successful unknown JSON response", () => {
    const wrongCitation = { invalidKey: "invalidValue" };
    mockFetch.mockImplementation(
      __getImplementation(JSON.stringify([wrongCitation]))
    );
    return expect(fetchSimpleCitation(url)).rejects.toThrow(
      "Unknown Citoid response format"
    );
  });
});
