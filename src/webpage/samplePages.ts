import { MediaWikiBaseFieldCitation } from "../citation/citationTypes";

export const pages: {
  [url: string]: {
    html: string;
    citoid: Array<MediaWikiBaseFieldCitation>;
  };
} = {
  "https://example.com/article1": {
    html: `
<!DOCTYPE html>
<html>
  <head>
    <!--https://json-ld.org/playground/-->
    <script type="application/ld+json">
    {
      "@context": "http://schema.org/",
      "@type": "Person",
      "name": "Jane Doe",
      "jobTitle": "Professor",
      "telephone": "(425) 123-4567",
      "url": "http://www.janedoe.com"
    }
    </script>
    <!--https://github.com/JSONPath-Plus/JSONPath-->
    <script type="application/ld+json">
    {
      "store": {
        "book": [
          {
            "category": "reference",
            "author": "Nigel Rees",
            "title": "Sayings of the Century",
            "price": 8.95
          },
          {
            "category": "fiction",
            "author": "Evelyn Waugh",
            "title": "Sword of Honour",
            "price": 12.99
          },
          {
            "category": "fiction",
            "author": "Herman Melville",
            "title": "Moby Dick",
            "isbn": "0-553-21311-3",
            "price": 8.99
          },
          {
            "category": "fiction",
            "author": "J. R. R. Tolkien",
            "title": "The Lord of the Rings",
            "isbn": "0-395-19395-8",
            "price": 22.99
          }
        ],
        "bicycle": {
          "color": "red",
          "price": 19.95
        }
      }
    }
    </script>
  </head>
  <body>
    <book author='Virginia Woolf'>
      <title>Orlando</title>
    </book>
    <book author='James Gleick'>
      <title>The Information</title>
    </book>
    <button value='value attr'>
      Button label
    </button>
  </body>
</html>
`,
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
