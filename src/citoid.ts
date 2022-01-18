// how to get the Citoid server response

// how to parse the Citoid server response

// basefield definition
// at least one non-creator field mapped to it
// creator field is firstCreator for at least one item type
export interface MediaWikiBaseFieldCitation {
  // required - https://www.mediawiki.org/wiki/Citoid/API#Field_names
  itemType: ItemType;
  title: string;
  url: string;

  // creators (basefield creator types only)
  attorneyAgent: Array<Creator>;
  author: Array<Creator>;
  bookAuthor: Array<Creator>;
  castMember: Array<Creator>;
  commenter: Array<Creator>;
  composer: Array<Creator>;
  contributor: Array<Creator>;
  cosponsor: Array<Creator>;
  counsel: Array<Creator>;
  editor: Array<Creator>;
  guest: Array<Creator>;
  interviewer: Array<Creator>;
  producer: Array<Creator>;
  recipient: Array<Creator>;
  reviewedAuthor: Array<Creator>;
  scriptwriter: Array<Creator>;
  seriesEditor: Array<Creator>;
  translator: Array<Creator>;
  wordsBy: Array<Creator>;

  // mediawiki
  // https://www.mediawiki.org/wiki/Citoid/API#Field_names
  isbn: Array<string>; // array in mediawiki format
  issn: Array<string>; // array in mediawiki format
  PMCID: string;
  PMID: string;
  oclc: string;
  source: Array<MetadataSource>;

  // zotero (basefields only)
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

  //
  tags: Array<Tag>;
  key: string;
  version: 0;
}

export interface MediaWikiCitation extends MediaWikiBaseFieldCitation {
  // creators (non-basefield creator types)
  artist: Array<Creator>; // non-basefield mediawiki
  cartographer: Array<Creator>; // non-basefield mediawiki
  director: Array<Creator>; // non-basefield mediawiki
  interviewee: Array<Creator>; // non-basefield mediawiki
  inventor: Array<Creator>; // non-basefield mediawiki
  performer: Array<Creator>; // non-basefield mediawiki
  podcaster: Array<Creator>; // non-basefield mediawiki
  presenter: Array<Creator>; // non-basefield mediawiki
  programmer: Array<Creator>; // non-basefield mediawiki
  sponsor: Array<Creator>; // non-basefield mediawiki

  // zotero (non-basefields only)
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

type Creator = [FirstName: string, LastName: string];

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
