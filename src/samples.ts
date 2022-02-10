import { CitoidCitation, SimpleCitoidCitation } from "./citoid";

export const sampleCitations: Array<{
  citoid: CitoidCitation;
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
      creators: [
        {
          creatorType: "author",
          firstName: "John",
          lastName: "Doe",
        },
        {
          creatorType: "author",
          firstName: "Jane",
          lastName: "Smith",
        },
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
