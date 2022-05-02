import { assert, Equals, Implements, OneKey } from "./utils";
import {
  ItemType,
  Tag,
  MetadataSource,
  MediaWikiCreator,
  ZoteroCreator,
} from "./valueTypes";
import {
  RequiredField,
  BaseTitleField,
  NonBaseTitleField,
  SpecialField,
  BaseField,
  NonBaseField,
  BaseCreatorField,
  NonBaseCreatorField,
  SplitBaseCreatorField,
  MediaWikiField,
  SimpleCitoidField,
} from "./keyTypes";

// Field types
//////////////

// Required fields
export interface RequiredFields {
  // required - https://www.mediawiki.org/wiki/Citoid/API#Field_names
  itemType: ItemType;
  url: string;
}
// confirm that RequiredFields has all and only the keys in REQUIRED_FIELDS
assert<Equals<RequiredField, keyof RequiredFields>>(true);

// Title fields
export type BaseTitleFields = {
  [key in BaseTitleField]: string;
};
export type NonBaseTitleFields = OneKey<NonBaseTitleField, string>;

// Special fields
export interface SpecialFields {
  tags: Array<Tag>;
  key: string;
  version: 0;
}
assert<Equals<SpecialField, keyof SpecialFields>>(true);

// Base fields
export type BaseFields = Record<BaseField, string>;

// Non-base fields
export type NonBaseFields = Record<NonBaseField, string>;

// Base creator fields
export type BaseCreatorFields = Record<
  BaseCreatorField,
  Array<MediaWikiCreator>
>;

// Non-base creator fields
export type NonBaseCreatorFields = Record<
  NonBaseCreatorField,
  Array<MediaWikiCreator>
>;

// Mediawiki fields
export type MediaWikiFields = Implements<
  Record<MediaWikiField, string | Array<string>>,
  {
    isbn: Array<string>; // array in mediawiki format
    issn: Array<string>; // array in mediawiki format
    PMCID: string;
    PMID: string;
    oclc: string;
    source: Array<MetadataSource>;
  }
>;

// Zotero fields
export interface ZoteroFields {
  creators: Array<ZoteroCreator>;
  ISBN: string;
  ISSN: string;
}

// Simple-citoid fields
export type SimpleCitoidFields = Record<
  RequiredField | BaseTitleField,
  string | string[]
> & {
  itemType: ItemType;
} & Partial<
    Record<
      | Exclude<SpecialField, "key" | "version">
      | BaseField
      | SplitBaseCreatorField
      | Exclude<MediaWikiField, "source">,
      string | string[]
    >
  >;
assert<Equals<SimpleCitoidField, keyof SimpleCitoidFields>>(true);
