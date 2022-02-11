import { MediaWikiCitation, SimpleCitoidCitation } from "./citoid";

export const sampleCitations: Array<{
  citoid: MediaWikiCitation;
  simple: SimpleCitoidCitation;
}> = [
  {
    citoid: {
      itemType: "webpage",
      title: "Sample article",
      tags: [
        { tag: "first tag", type: 0 },
        { tag: "second tag", type: 0 },
      ],
      url: "https://example.com/article1",
      author: [
        ["John", "Doe"],
        ["Jane", "Smith"],
      ],
      key: "",
      version: 0,
    },
    simple: {
      itemType: "webpage",
      title: "Sample article",
      tags: ["first tag", "second tag"],
      url: "https://example.com/article1",
      authorFirst: ["John", "Jane"],
      authorLast: ["Doe", "Smith"],
    },
  },
];
