import {
  RequiredFields,
  BaseTitleFields,
  NonBaseTitleFields,
  SpecialFields,
  BaseFields,
  NonBaseFields,
  BaseCreatorFields,
  NonBaseCreatorFields,
  MediaWikiFields,
  ZoteroFields,
  SimpleCitoidFields,
} from "./fieldTypes";
import { REQUIRED_FIELDS, TITLE_FIELDS } from "./keyTypes";

// Citoid citation types

export type MediaWikiCitation = RequiredFields &
  (BaseTitleFields | NonBaseTitleFields) &
  Partial<
    SpecialFields &
      BaseFields &
      NonBaseFields &
      BaseCreatorFields &
      NonBaseCreatorFields &
      MediaWikiFields
  >;

export type MediaWikiBaseFieldCitation = RequiredFields &
  BaseTitleFields &
  Partial<SpecialFields & BaseFields & BaseCreatorFields & MediaWikiFields>;

export type ZoteroCitation = RequiredFields &
  (BaseTitleFields | NonBaseTitleFields) &
  Partial<SpecialFields & BaseFields & NonBaseFields & ZoteroFields>;

export type CitoidCitation =
  | MediaWikiCitation
  | MediaWikiBaseFieldCitation
  | ZoteroCitation;

export function isCitoidCitation(
  citation: unknown
): citation is CitoidCitation {
  return (
    REQUIRED_FIELDS.every(
      (field) => (citation as CitoidCitation)[field] !== undefined
    ) && TITLE_FIELDS.some((field) => field in (citation as CitoidCitation))
  );
}

// Special citation types

export type WebToCitCitation = Omit<MediaWikiBaseFieldCitation, "source"> & {
  source: Array<"Web2Cit" | "Zotero">;
};

export type SimpleCitoidCitation = SimpleCitoidFields;
