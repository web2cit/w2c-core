import { Citation } from "./citation";
import {
  MediaWikiCitation,
  MediaWikiBaseFieldCitation,
  SimpleCitoidCitation,
} from "./citationTypes";
import { SimpleCitoidFields } from "./fieldTypes";

const mwCitation: MediaWikiCitation = {
  // required
  itemType: "case",
  url: "https://example.com",
  // non-base title
  caseName: "case name",
  // special
  tags: [
    { tag: "first tag", type: 0 },
    { tag: "second tag", type: 0 },
  ],
  // base regular
  abstractNote: "abstract note",
  // non-base regular
  artworkMedium: "medium",
  // base creator
  editor: [
    ["First", "Editor"],
    ["Second", "Editor"],
  ],
  // non-base creator
  contributor: [
    ["First", "Author"],
    ["Second", "Author"],
  ],
};

const mwbCitation: MediaWikiCitation = {
  itemType: "case",
  url: "https://example.com",
  title: "case name",
  tags: [
    { tag: "first tag", type: 0 },
    { tag: "second tag", type: 0 },
  ],
  abstractNote: "abstract note",
  medium: "medium",
  editor: [
    ["First", "Editor"],
    ["Second", "Editor"],
  ],
  author: [
    ["First", "Author"],
    ["Second", "Author"],
  ],
};

const simpleCitation: SimpleCitoidCitation = {
  itemType: "case",
  url: "https://example.com",
  title: "case name",
  tags: ["first tag", "second tag"],
  abstractNote: "abstract note",
  medium: "medium",
  editorFirst: ["First", "Second"],
  editorLast: ["Editor", "Editor"],
  authorFirst: ["First", "Second"],
  authorLast: ["Author", "Author"],
};

it("creates citation object from mediawiki citation", () => {
  const citation = new Citation(mwCitation);
  expect(citation.mediawiki).toEqual(mwCitation);
});

it("converts to mediawiki-basefields citation", () => {
  const citation = new Citation(mwCitation);
  expect(citation.mediawikibase).toEqual(mwbCitation);
});

it("converts to simple citation", () => {
  const citation = new Citation(mwCitation);
  expect(citation.simple).toEqual(simpleCitation);
});
