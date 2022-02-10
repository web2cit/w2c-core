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

// todo: implement
it("handles ok response with unexpected data format", () => {
  expect(false).toBe(true);
});
