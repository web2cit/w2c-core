import fetch, { Headers } from "node-fetch";
import { HTTPResponseError } from "./errors";

export const API_ENDPOINT =
  "https://en.wikipedia.org/api/rest_v1/data/citation/";

type CitoidRequestFormat = "mediawiki" | "mediawiki-basefields" | "zotero";
// | 'bibtex'
// | 'wikibase'

export function translateUrl(
  query: string,
  format: CitoidRequestFormat = "mediawiki-basefields",
  language?: string
): Promise<CitoidCitation> {
  const url = [API_ENDPOINT, format, encodeURIComponent(query)].join("/");
  const headers = new Headers();
  headers.append("accept", "application/json; charset=utf-8;");
  if (language) headers.append("Accept-Language", language);

  return new Promise<CitoidCitation>((resolve, reject) => {
    fetch(url, { headers })
      .then(async (response) => {
        if (response.ok) {
          const citations: Array<CitoidCitation> = await response.json();
          // url queries should return only one citation
          // https://www.mediawiki.org/wiki/Citoid/API#Successful_response_in_mediawiki_format
          resolve(citations[0]);
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

// todo: split mediawikicitation fields into first and last

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

interface BaseFields {
  abstractNote: string;
  accessDate: string;
  applicationNumber: string;
  archive: string;
  archiveLocation: string;
  artworkSize: string;
  assignee: string;
  callNumber: string;
  code: string;
  codeNumber: string;
  committee: string;
  conferenceName: string;
  country: string;
  court: string;
  date: string;
  DOI: string;
  edition: string;
  extra: string;
  filingDate: string;
  history: string;
  issue: string;
  issuingAuthority: string;
  journalAbbreviation: string;
  language: string;
  legalStatus: string;
  legislativeBody: string;
  libraryCatalog: string;
  medium: string;
  meetingName: string;
  number: string;
  numberOfVolumes: string;
  numPages: string;
  pages: string;
  place: string;
  priorityNumbers: string;
  programmingLanguage: string;
  publicationTitle: string;
  publisher: string;
  references: string;
  reporter: string;
  rights: string;
  runningTime: string;
  scale: string;
  section: string;
  series: string;
  seriesNumber: string;
  seriesText: string;
  seriesTitle: string;
  session: string;
  shortTitle: string;
  system: string;
  type: string;
  versionNumber: string;
  volume: string;
}

interface NonBaseFields {
  // NO field is mapped to this field in ANY item type
  artworkMedium: string;
  audioFileType: string;
  audioRecordingFormat: string;
  billNumber: string;
  blogTitle: string;
  bookTitle: string;
  caseName: string;
  codePages: string;
  codeVolume: string;
  company: string;
  dateDecided: string;
  dateEnacted: string;
  dictionaryTitle: string;
  distributor: string;
  docketNumber: string;
  documentNumber: string;
  encyclopediaTitle: string;
  episodeNumber: string;
  firstPage: string;
  forumTitle: string;
  genre: string;
  institution: string;
  interviewMedium: string;
  issueDate: string;
  label: string;
  letterType: string;
  manuscriptType: string;
  mapType: string;
  nameOfAct: string;
  network: string;
  patentNumber: string;
  postType: string;
  presentationType: string;
  proceedingsTitle: string;
  programTitle: string;
  publicLawNumber: string;
  reporterVolume: string;
  reportNumber: string;
  reportType: string;
  studio: string;
  subject: string;
  thesisType: string;
  university: string;
  videoRecordingFormat: string;
  websiteTitle: string;
  websiteType: string;
}

interface MediaWikiFields {
  // https://www.mediawiki.org/wiki/Citoid/API#Field_names
  isbn: Array<string>; // array in mediawiki format
  issn: Array<string>; // array in mediawiki format
  PMCID: string;
  PMID: string;
  oclc: string;
  source: Array<MetadataSource>;
}

interface ZoteroFields {
  creators: Array<ZoteroCreator>;
  ISBN: string;
  ISSN: string;
}

type BaseCreatorType =
  | "attorneyAgent"
  | "author"
  | "bookAuthor"
  | "castMember"
  | "commenter"
  | "composer"
  | "contributor"
  | "cosponsor"
  | "counsel"
  | "editor"
  | "guest"
  | "interviewer"
  | "producer"
  | "recipient"
  | "reviewedAuthor"
  | "scriptwriter"
  | "seriesEditor"
  | "translator"
  | "wordsBy";

type NonBaseCreatorType =
  | "artist"
  | "cartographer"
  | "director"
  | "interviewee"
  | "inventor"
  | "performer"
  | "podcaster"
  | "presenter"
  | "programmer"
  | "sponsor";

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

type MediaWikiCreator = [FirstName: string, LastName: string];

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

type CitoidCitation =
  | MediaWikiCitation
  | MediaWikiBaseFieldCitation
  | ZoteroCitation;

// https://aurimasv.github.io/z2csl/typeMap.xml
type ItemType =
  | "artwork"
  | "attachment"
  | "audioRecording"
  | "bill"
  | "blogPost"
  | "book"
  | "bookSection"
  | "case"
  | "computerProgram"
  | "conferencePaper"
  | "dictionaryEntry"
  | "document"
  | "email"
  | "encyclopediaArticle"
  | "film"
  | "forumPost"
  | "hearing"
  | "instantMessage"
  | "interview"
  | "journalArticle"
  | "letter"
  | "magazineArticle"
  | "manuscript"
  | "map"
  | "newspaperArticle"
  | "note"
  | "patent"
  | "podcast"
  | "presentation"
  | "radioBroadcast"
  | "report"
  | "statute"
  | "thesis"
  | "tvBroadcast"
  | "videoRecording"
  | "webpage";

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
