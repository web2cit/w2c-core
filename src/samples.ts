import { MediaWikiBaseFieldCitation } from "./citoid";

export const sampleCitations: Array<MediaWikiBaseFieldCitation> = [
  {
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
];
