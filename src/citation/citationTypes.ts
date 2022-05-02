import {
  RequiredFields,
  SpecialFields,
  BaseFields,
  NonBaseFields,
  BaseCreatorFields,
  NonBaseCreatorFields,
  MediaWikiFields,
  ZoteroFields,
  SimpleCitoidFields,
} from "./fieldTypes";
import { REQUIRED_FIELDS } from "./keyTypes";

// Citoid citation types

export type MediaWikiCitation = RequiredFields &
  Partial<
    SpecialFields &
      BaseFields &
      NonBaseFields &
      BaseCreatorFields &
      NonBaseCreatorFields &
      MediaWikiFields
  >;

export type MediaWikiBaseFieldCitation = RequiredFields &
  Partial<SpecialFields & BaseFields & BaseCreatorFields & MediaWikiFields>;

export type ZoteroCitation = RequiredFields &
  Partial<SpecialFields & BaseFields & NonBaseFields & ZoteroFields>;

export type CitoidCitation =
  | MediaWikiCitation
  | MediaWikiBaseFieldCitation
  | ZoteroCitation;

export function isCitoidCitation(
  citation: unknown
): citation is CitoidCitation {
  return REQUIRED_FIELDS.every(
    (field) => (citation as CitoidCitation)[field] !== undefined
  );
}

// Special citation types

export type WebToCitCitation = Omit<MediaWikiBaseFieldCitation, "source"> & {
  source: Array<"Web2Cit" | "Zotero">;
};

export type SimpleCitoidCitation = SimpleCitoidFields;
