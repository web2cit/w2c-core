import { MediaWikiBaseFieldCitation } from "./citoid";

export const pages: {
  [url: string]: {
    html: string;
    citoid: Array<MediaWikiBaseFieldCitation>;
  };
} = {
  "https://example.com/article1": {
    html: "\
<!DOCTYPE html>\
<html>\
  <head></head>\
  <body>\
    <book author='Virginia Woolf'>\
      <title>Orlando</title>\
    </book>\
    <book author='James Gleick'>\
      <title>The Information</title>\
    </book>\
  </body>\
</html>\
    ",
    citoid: [
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
    ],
  },
  "https://example.com/article2": {
    html: "",
    citoid: [
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
    ],
  },
};
