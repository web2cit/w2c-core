import { BaseCreatorType, NonBaseCreatorType } from "./creatorTypes";

// Value types
//////////////

export { ItemType } from "../translationField";

// Tag value type
export interface Tag {
  tag: string;
  type: number;
}

// Source value type
export type MetadataSource =
  | "CrossRef"
  | "WorldCat"
  | "Zotero" // URL queries from Web2Cit would always return this
  | "citoid" // not sure when 'citoid' would be a source
  | "PubMed";
// ISBN queries may include library catalog as source

// MediaWiki creator value type
export type MediaWikiCreator = [FirstName: string, LastName: string];

// Zotero creator value type
type OneFieldZoteroCreator = {
  firstName: string;
  lastName: string;
  creatorType: BaseCreatorType | NonBaseCreatorType;
};

type TwoFieldZoteroCreator = {
  name: string;
  creatorType: BaseCreatorType | NonBaseCreatorType;
};

export type ZoteroCreator = OneFieldZoteroCreator | TwoFieldZoteroCreator;
