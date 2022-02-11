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
  {
    itemType: "webpage",
    title: "Sample article",
    author: [
      ["John", "Smith"],
      ["Jane", "Doe"],
      ["", "University of Somewhere"],
    ],
    date: "2022-02-04",
    publicationTitle: "Journal title",
    publisher: "Journal publisher",
    url: "https://example.com/article1",
    tags: [],
    key: "",
    version: 0,
  },
];
