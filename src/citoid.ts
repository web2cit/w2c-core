import fetch, { Headers } from "node-fetch";
import { HTTPResponseError } from "./errors";
import { ItemType } from "./translationField";
import { CITOID_API_ENDPOINT as API_ENDPOINT } from "./config";

// type CitoidRequestFormat = "mediawiki" | "mediawiki-basefields" | "zotero";
// | 'bibtex'
// | 'wikibase'

function translateUrl(
  query: string,
  // format: CitoidRequestFormat = "mediawiki-basefields",
  language?: string
): Promise<CitoidCitation> {
  const url = [API_ENDPOINT, encodeURIComponent(query)].join("/");
  const headers = new Headers();
  headers.append("accept", "application/json; charset=utf-8;");
  if (language) headers.append("Accept-Language", language);

  return new Promise<CitoidCitation>((resolve, reject) => {
    fetch(url, { headers })
      .then(async (response) => {
        if (response.ok) {
          const responseText = await response.text();
          let citations;
          try {
            citations = JSON.parse(responseText);
          } catch {
            citations = null;
          }
          if (
            Array.isArray(citations) &&
            citations.every((citation) => isCitoidCitation(citation))
          ) {
            // url queries should return only one citation
            // https://www.mediawiki.org/wiki/Citoid/API#Successful_response_in_mediawiki_format
            resolve(citations[0]);
          } else {
            reject(
              new Error(`Unknown Citoid response format: ${responseText}`)
            );
          }
        } else {
          // the response contains client (4xx) or server (5xx) error responses
          // see https://github.com/node-fetch/node-fetch#handling-client-and-server-errors
          const error = new HTTPResponseError(response);
          if (response.status === 504) {
            // response.body = upstream request timeout
            reject(error);
          } else if (response.status === 520) {
            // custom 520 response that returns a citation object
            // even if no data is able to be retrieved
            // https://www.mediawiki.org/wiki/Citoid/API#Unsuccessful_response
            reject(error);
          } else {
            // some errors will return a problem json
            // https://www.mediawiki.org/wiki/HyperSwitch/errors
            reject(error);
          }
        }
      })
      .catch((reason) => {
        // see https://github.com/node-fetch/node-fetch/blob/main/docs/ERROR-HANDLING.md
        // All operational errors other than aborted requests are rejected with a FetchError.
        reject(reason);
      });
  });
}

function isCitoidCitation(citation: unknown): citation is CitoidCitation {
  return REQUIRED_FIELDS.every(
    (field) => (citation as CitoidCitation)[field] !== undefined
  );
}

export function fetchSimpleCitation(
  url: string,
  language?: string
): Promise<SimpleCitoidCitation> {
  return new Promise((resolve, reject) => {
    translateUrl(url, language)
      .then((citation) => {
        const simpleCitation = simplifyCitation(
          citation as MediaWikiBaseFieldCitation
        );
        resolve(simpleCitation);
      })
      .catch((reason) => {
        reject(reason);
      });
  });
}

export const REQUIRED_FIELDS = [
  "itemType",
  "title",
  "url",
  "tags",
  "key",
  "version",
] as const;
type RequiredField = typeof REQUIRED_FIELDS[number];
interface RequiredFields {
  // required - https://www.mediawiki.org/wiki/Citoid/API#Field_names
  itemType: ItemType;
  title: string;
  url: string;

  //
  tags: Array<Tag>;
  key: string;
  version: 0;
}
// confirm that RequiredFields has all and only the keys in REQUIRED_FIELDS
// from https://stackoverflow.com/questions/55046211/typescript-check-if-type-a-type-b-type-c
// and https://github.com/microsoft/TypeScript/issues/27024#issuecomment-421529650
export type Equals<X, Y> = (<T>() => T extends X ? 1 : 2) extends <
  T
>() => T extends Y ? 1 : 2
  ? true
  : false;
function assert<T extends boolean>(expect: T) {
  return expect;
}
assert<Equals<RequiredField, keyof RequiredFields>>(true);

export const BASE_FIELDS = [
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
type BaseField = typeof BASE_FIELDS[number];
type BaseFields = Record<BaseField, string>;

export const NON_BASE_FIELDS = [
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
type NonBaseField = typeof NON_BASE_FIELDS[number];
type NonBaseFields = Record<NonBaseField, string>;

const MEDIA_WIKI_FIELDS = [
  // https://www.mediawiki.org/wiki/Citoid/API#Field_names
  "isbn",
  "issn",
  "PMCID",
  "PMID",
  "oclc",
  "source",
] as const;
type MediaWikiField = typeof MEDIA_WIKI_FIELDS[number];

// see https://github.com/Microsoft/TypeScript/issues/24274
type Implements<T, R extends T> = R;
type MediaWikiFields = Implements<
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

interface ZoteroFields {
  creators: Array<ZoteroCreator>;
  ISBN: string;
  ISSN: string;
}

export const BASE_CREATOR_TYPES = [
  "attorneyAgent",
  "author",
  "bookAuthor",
  "castMember",
  "commenter",
  "composer",
  "contributor",
  "cosponsor",
  "counsel",
  "editor",
  "guest",
  "interviewer",
  "producer",
  "recipient",
  "reviewedAuthor",
  "scriptwriter",
  "seriesEditor",
  "translator",
  "wordsBy",
] as const;
type BaseCreatorType = typeof BASE_CREATOR_TYPES[number];

export const NON_BASE_CREATOR_TYPES = [
  "artist",
  "cartographer",
  "director",
  "interviewee",
  "inventor",
  "performer",
  "podcaster",
  "presenter",
  "programmer",
  "sponsor",
] as const;
type NonBaseCreatorType = typeof NON_BASE_CREATOR_TYPES[number];

type BaseMWCreatorFields = Record<BaseCreatorType, Array<MediaWikiCreator>>;
type NonBaseMWCreatorFields = Record<
  NonBaseCreatorType,
  Array<MediaWikiCreator>
>;

interface OneFieldZoteroCreator {
  firstName: string;
  lastName: string;
  creatorType: BaseCreatorType | NonBaseCreatorType;
}

interface TwoFieldZoteroCreator {
  name: string;
  creatorType: BaseCreatorType | NonBaseCreatorType;
}

type ZoteroCreator = OneFieldZoteroCreator | TwoFieldZoteroCreator;

export type MediaWikiCreator = [FirstName: string, LastName: string];

export type ZoteroCitation = RequiredFields &
  Partial<BaseFields & NonBaseFields & ZoteroFields>;

export type MediaWikiCitation = RequiredFields &
  Partial<
    BaseFields &
      NonBaseFields &
      BaseMWCreatorFields &
      NonBaseMWCreatorFields &
      MediaWikiFields
  >;

export type MediaWikiBaseFieldCitation = RequiredFields &
  Partial<BaseFields & BaseMWCreatorFields & MediaWikiFields>;

export type CitoidCitation =
  | MediaWikiCitation
  | MediaWikiBaseFieldCitation
  | ZoteroCitation;

const SPLIT_BASE_CREATOR_TYPES = BASE_CREATOR_TYPES.reduce(
  (splitCreators: Array<string>, creator: BaseCreatorType) => {
    splitCreators.push(creator + "First", creator + "Last");
    return splitCreators;
  },
  []
);
type SplitBaseCreatorType =
  | `${BaseCreatorType}First`
  | `${BaseCreatorType}Last`;

const SIMPLE_CITOID_FIELDS = Array.prototype.concat(
  ["itemType", "title", "url"], // required fields without tags, key & version
  ["tags"], // other required fields without key & version
  BASE_FIELDS,
  SPLIT_BASE_CREATOR_TYPES,
  MEDIA_WIKI_FIELDS.filter((field) => !["source"].includes(field))
);
export type SimpleCitoidField =
  | keyof Omit<RequiredFields, "key" | "version">
  | BaseField
  | SplitBaseCreatorType
  | Exclude<MediaWikiField, "source">;

export type SimpleCitoidCitation = Partial<
  Record<SimpleCitoidField, string | Array<string>>
> &
  Pick<
    Record<SimpleCitoidField, string | Array<string>>,
    "itemType" | "tags" | "title" | "url"
  > & {
    itemType: ItemType;
  };

// user-defined type guard
// see https://www.typescriptlang.org/docs/handbook/advanced-types.html#user-defined-type-guards
export function isSimpleCitoidField(
  field: unknown
): field is SimpleCitoidField {
  return SIMPLE_CITOID_FIELDS.includes(field as SimpleCitoidField);
}

function simplifyCitation(
  mwbCitation: MediaWikiBaseFieldCitation
): SimpleCitoidCitation {
  const simpleCitation: SimpleCitoidCitation = {
    itemType: mwbCitation.itemType,
    tags: mwbCitation.tags.map((tag) => tag.tag),
    title: mwbCitation.title,
    url: mwbCitation.url,
  };
  // split mediawiki creator arrays into creatorFirst and creatorLast arrays
  for (const baseCreatorType of BASE_CREATOR_TYPES) {
    const creators = mwbCitation[baseCreatorType];
    if (creators) {
      simpleCitation[`${baseCreatorType}First`] = creators.map(
        (creator) => creator[0]
      );
      simpleCitation[`${baseCreatorType}Last`] = creators.map(
        (creator) => creator[1]
      );
    }
  }
  for (const field of SIMPLE_CITOID_FIELDS as Array<
    Exclude<SimpleCitoidField, "itemType">
  >) {
    if (field in mwbCitation && !(field in simpleCitation)) {
      const value = mwbCitation[field as keyof MediaWikiBaseFieldCitation] as
        | string
        | Array<string>;
      simpleCitation[field] = value;
    }
  }
  return simpleCitation;
}

interface Tag {
  tag: string;
  type: number;
}

type MetadataSource =
  | "CrossRef"
  | "WorldCat"
  | "Zotero" // URL queries from Web2Cit would always return this
  | "citoid" // not sure when 'citoid' would be a source
  | "PubMed";
// ISBN queries may include library catalog as source
