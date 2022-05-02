import {
  BaseCreatorType,
  NonBaseCreatorType,
  BASE_CREATOR_TYPES,
} from "./creatorTypes";

// Required field key type
export const REQUIRED_FIELDS = ["itemType", "title", "url"] as const;
export type RequiredField = typeof REQUIRED_FIELDS[number];

// Special field key type
const SPECIAL_FIELDS = ["tags", "key", "version"] as const;
export type SpecialField = typeof SPECIAL_FIELDS[number];

// Base field key type
const BASE_FIELDS = [
  "abstractNote",
  "accessDate",
  "applicationNumber",
  "archive",
  "archiveLocation",
  "artworkSize",
  "assignee",
  "callNumber",
  "code",
  "codeNumber",
  "committee",
  "conferenceName",
  "country",
  "court",
  "date",
  "DOI",
  "edition",
  "extra",
  "filingDate",
  "history",
  "issue",
  "issuingAuthority",
  "journalAbbreviation",
  "language",
  "legalStatus",
  "legislativeBody",
  "libraryCatalog",
  "medium",
  "meetingName",
  "number",
  "numberOfVolumes",
  "numPages",
  "pages",
  "place",
  "priorityNumbers",
  "programmingLanguage",
  "publicationTitle",
  "publisher",
  "references",
  "reporter",
  "rights",
  "runningTime",
  "scale",
  "section",
  "series",
  "seriesNumber",
  "seriesText",
  "seriesTitle",
  "session",
  "shortTitle",
  "system",
  "type",
  "versionNumber",
  "volume",
] as const;
export type BaseField = typeof BASE_FIELDS[number];

// Non-base field key type
const NON_BASE_FIELDS = [
  // NO field is mapped to this field in ANY item type
  "artworkMedium",
  "audioFileType",
  "audioRecordingFormat",
  "billNumber",
  "blogTitle",
  "bookTitle",
  "caseName",
  "codePages",
  "codeVolume",
  "company",
  "dateDecided",
  "dateEnacted",
  "dictionaryTitle",
  "distributor",
  "docketNumber",
  "documentNumber",
  "encyclopediaTitle",
  "episodeNumber",
  "firstPage",
  "forumTitle",
  "genre",
  "institution",
  "interviewMedium",
  "issueDate",
  "label",
  "letterType",
  "manuscriptType",
  "mapType",
  "nameOfAct",
  "network",
  "patentNumber",
  "postType",
  "presentationType",
  "proceedingsTitle",
  "programTitle",
  "publicLawNumber",
  "reporterVolume",
  "reportNumber",
  "reportType",
  "studio",
  "subject",
  "thesisType",
  "university",
  "videoRecordingFormat",
  "websiteTitle",
  "websiteType",
] as const;
export type NonBaseField = typeof NON_BASE_FIELDS[number];

// Base creator field key type
export type BaseCreatorField = BaseCreatorType;

// Non-base creator field key type
export type NonBaseCreatorField = NonBaseCreatorType;

// Mediawiki field key type
const MEDIA_WIKI_ID_FIELDS = ["isbn", "issn", "PMCID", "PMID", "oclc"] as const;
const MEDIA_WIKI_FIELDS = [
  // https://www.mediawiki.org/wiki/Citoid/API#Field_names
  ...MEDIA_WIKI_ID_FIELDS,
  "source",
] as const;
export type MediaWikiField = typeof MEDIA_WIKI_FIELDS[number];

// Simple-citoid field key type
const SIMPLE_CITOID_NON_CREATOR_FIELDS = [
  ...REQUIRED_FIELDS,
  "tags",
  ...BASE_FIELDS,
  ...MEDIA_WIKI_ID_FIELDS,
] as const;
type SimpleCitoidNonCreatorField =
  typeof SIMPLE_CITOID_NON_CREATOR_FIELDS[number];

const SPLIT_BASE_CREATOR_FIELDS: SplitBaseCreatorField[] = [
  ...BASE_CREATOR_TYPES.map(
    (creator) => `${creator}First` as SplitBaseCreatorField
  ),
  ...BASE_CREATOR_TYPES.map(
    (creator) => `${creator}Last` as SplitBaseCreatorField
  ),
];
export type SplitBaseCreatorField =
  | `${BaseCreatorType}First`
  | `${BaseCreatorType}Last`;

export const SIMPLE_CITOID_FIELDS = [
  ...SIMPLE_CITOID_NON_CREATOR_FIELDS,
  ...SPLIT_BASE_CREATOR_FIELDS,
];
export type SimpleCitoidField =
  | SimpleCitoidNonCreatorField
  | SplitBaseCreatorField;

export function isSimpleCitoidField(
  field: unknown
): field is SimpleCitoidField {
  if (
    SIMPLE_CITOID_NON_CREATOR_FIELDS.includes(
      field as SimpleCitoidNonCreatorField
    )
  ) {
    return true;
  } else if (
    SPLIT_BASE_CREATOR_FIELDS.includes(field as SplitBaseCreatorField)
  ) {
    return true;
  } else {
    return false;
  }
}

// add non-base to base map
