import { CitoidCitation } from "./citoid";

export const sampleCitation: CitoidCitation = {
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
};
