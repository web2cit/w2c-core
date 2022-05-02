import {
  BaseCreatorType,
  NonBaseCreatorType,
  BASE_CREATOR_TYPES,
  isCreatorType,
} from "./creatorTypes";

// Required field key type
export const REQUIRED_FIELDS = ["itemType", "url"] as const;
export type RequiredField = typeof REQUIRED_FIELDS[number];
// export function isRequiredField(field: unknown): field is RequiredField {
//   if (REQUIRED_FIELDS.includes(field as RequiredField)) {
//     return true;
//   } else {
//     return false;
//   }
// }

// Title field key types
const BASE_TITLE_FIELDS = ["title"] as const;
export type BaseTitleField = typeof BASE_TITLE_FIELDS[number];
const NON_BASE_TITLE_FIELDS = ["caseName", "subject", "nameOfAct"] as const;
export type NonBaseTitleField = typeof NON_BASE_TITLE_FIELDS[number];
export const TITLE_FIELDS = [
  ...BASE_TITLE_FIELDS,
  ...NON_BASE_TITLE_FIELDS,
] as const;

// Special field key type
const SPECIAL_FIELDS = ["tags", "key", "version"] as const;
export type SpecialField = typeof SPECIAL_FIELDS[number];
// export function isSpecialField(field: unknown): field is SpecialField {
//   if (SPECIAL_FIELDS.includes(field as SpecialField)) {
//     return true;
//   } else {
//     return false;
//   }
// }

// Regular field key types
const BASE_REGULAR_FIELDS = [
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
export type BaseRegularField = typeof BASE_REGULAR_FIELDS[number];

const NON_BASE_REGULAR_FIELDS = [
  // NO field is mapped to this field in ANY item type
  "artworkMedium",
  "audioFileType",
  "audioRecordingFormat",
  "billNumber",
  "blogTitle",
  "bookTitle",
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
  "thesisType",
  "university",
  "videoRecordingFormat",
  "websiteTitle",
  "websiteType",
] as const;
export type NonBaseRegularField = typeof NON_BASE_REGULAR_FIELDS[number];

type RegularField = BaseRegularField | NonBaseRegularField;

export function isRegularField(field: unknown): field is RegularField {
  return (
    BASE_REGULAR_FIELDS.includes(field as BaseRegularField) ||
    NON_BASE_REGULAR_FIELDS.includes(field as NonBaseRegularField)
  );
}

// Creator field key types
export type BaseCreatorField = BaseCreatorType;
export type NonBaseCreatorField = NonBaseCreatorType;
type CreatorField = BaseCreatorField | NonBaseCreatorField;
export function isCreatorField(field: unknown): field is CreatorField {
  return isCreatorType(field);
}

// Mediawiki field key type
const MEDIA_WIKI_ID_FIELDS = ["isbn", "issn", "PMCID", "PMID", "oclc"] as const;
const MEDIA_WIKI_FIELDS = [
  // https://www.mediawiki.org/wiki/Citoid/API#Field_names
  ...MEDIA_WIKI_ID_FIELDS,
  "source",
] as const;
export type MediaWikiField = typeof MEDIA_WIKI_FIELDS[number];
// export function isMediaWikiField(field: unknown): field is MediaWikiField {
//   if (MEDIA_WIKI_FIELDS.includes(field as MediaWikiField)) {
//     return true;
//   } else {
//     return false;
//   }
// }

// Simple-citoid field key type
const SIMPLE_CITOID_NON_CREATOR_FIELDS = [
  ...REQUIRED_FIELDS,
  ...BASE_TITLE_FIELDS,
  "tags",
  ...BASE_REGULAR_FIELDS,
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

// Base field map
export const baseFieldMap: Map<
  | BaseTitleField
  | NonBaseTitleField
  | BaseRegularField
  | NonBaseRegularField
  | BaseCreatorField
  | NonBaseCreatorField,
  BaseTitleField | BaseRegularField | BaseCreatorField
> = new Map([
  // https://docs.google.com/spreadsheets/d/1YcscX9krRtmSflOLKSa1FeVAfVzwZYo72Mev6h8yWOw/edit#gid=505421956
  ["title", "title"],
  ["abstractNote", "abstractNote"],
  ["artworkMedium", "medium"],
  ["artworkSize", "artworkSize"],
  ["date", "date"],
  ["language", "language"],
  ["shortTitle", "shortTitle"],
  ["archive", "archive"],
  ["archiveLocation", "archiveLocation"],
  ["libraryCatalog", "libraryCatalog"],
  ["callNumber", "callNumber"],
  // ["url", "url"],
  ["accessDate", "accessDate"],
  ["rights", "rights"],
  ["extra", "extra"],
  ["audioRecordingFormat", "medium"],
  ["seriesTitle", "seriesTitle"],
  ["volume", "volume"],
  ["numberOfVolumes", "numberOfVolumes"],
  ["place", "place"],
  ["label", "publisher"],
  ["runningTime", "runningTime"],
  // ["ISBN", "ISBN"],
  ["billNumber", "number"],
  ["code", "code"],
  ["codeVolume", "volume"],
  ["section", "section"],
  ["codePages", "pages"],
  ["legislativeBody", "legislativeBody"],
  ["session", "session"],
  ["history", "history"],
  ["blogTitle", "publicationTitle"],
  ["websiteType", "type"],
  ["series", "series"],
  ["seriesNumber", "seriesNumber"],
  ["edition", "edition"],
  ["publisher", "publisher"],
  ["numPages", "numPages"],
  ["bookTitle", "publicationTitle"],
  ["pages", "pages"],
  ["caseName", "title"],
  ["court", "court"],
  ["dateDecided", "date"],
  ["docketNumber", "number"],
  ["reporter", "reporter"],
  ["reporterVolume", "volume"],
  ["firstPage", "pages"],
  ["versionNumber", "versionNumber"],
  ["system", "system"],
  ["company", "publisher"],
  ["programmingLanguage", "programmingLanguage"],
  ["proceedingsTitle", "publicationTitle"],
  ["conferenceName", "conferenceName"],
  ["DOI", "DOI"],
  ["dictionaryTitle", "publicationTitle"],
  ["subject", "title"],
  ["encyclopediaTitle", "publicationTitle"],
  ["distributor", "publisher"],
  ["genre", "type"],
  ["videoRecordingFormat", "medium"],
  ["forumTitle", "publicationTitle"],
  ["postType", "type"],
  ["committee", "committee"],
  ["documentNumber", "number"],
  ["interviewMedium", "medium"],
  ["publicationTitle", "publicationTitle"],
  ["issue", "issue"],
  ["seriesText", "seriesText"],
  ["journalAbbreviation", "journalAbbreviation"],
  // ["ISSN", "ISSN"],
  ["letterType", "type"],
  ["manuscriptType", "type"],
  ["mapType", "type"],
  ["scale", "scale"],
  ["country", "country"],
  ["assignee", "assignee"],
  ["issuingAuthority", "issuingAuthority"],
  ["patentNumber", "number"],
  ["filingDate", "filingDate"],
  ["applicationNumber", "applicationNumber"],
  ["priorityNumbers", "priorityNumbers"],
  ["issueDate", "date"],
  ["references", "references"],
  ["legalStatus", "legalStatus"],
  ["episodeNumber", "number"],
  ["audioFileType", "medium"],
  ["presentationType", "type"],
  ["meetingName", "meetingName"],
  ["programTitle", "publicationTitle"],
  ["network", "publisher"],
  ["reportNumber", "number"],
  ["reportType", "type"],
  ["institution", "publisher"],
  ["nameOfAct", "title"],
  ["codeNumber", "codeNumber"],
  ["publicLawNumber", "number"],
  ["dateEnacted", "date"],
  ["thesisType", "type"],
  ["university", "publisher"],
  ["studio", "publisher"],
  ["websiteTitle", "publicationTitle"],
  ["medium", "medium"],
  ["type", "type"],
  ["number", "number"],
  ["author", "author"],
  ["contributor", "author"],
  ["editor", "editor"],
  ["seriesEditor", "seriesEditor"],
  ["translator", "translator"],
  ["bookAuthor", "bookAuthor"],
  ["reviewedAuthor", "reviewedAuthor"],
  ["recipient", "recipient"],
  ["interviewee", "author"],
  ["interviewer", "interviewer"],
  ["director", "author"],
  ["producer", "producer"],
  ["scriptwriter", "scriptwriter"],
  ["artist", "author"],
  ["sponsor", "author"],
  ["cosponsor", "cosponsor"],
  ["counsel", "counsel"],
  ["inventor", "author"],
  ["attorneyAgent", "attorneyAgent"],
  ["cartographer", "author"],
  ["commenter", "commenter"],
  ["performer", "author"],
  ["composer", "composer"],
  ["wordsBy", "wordsBy"],
  ["presenter", "author"],
  ["castMember", "castMember"],
  ["guest", "guest"],
  ["podcaster", "author"],
  ["programmer", "author"],
]);
