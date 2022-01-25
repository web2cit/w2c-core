import { SimpleCitoidField } from './citoid';

interface TranslationOutput {
    targetUrl;

}

const fields: Array<TranslationField> = [
    {
        name: 'itemType',
        required: true,
        pattern: new RegExp(ITEM_TYPES.join('|'))
        citoidField: 'itemType',
        defaultTransformations: [],
        validation: true
    },
    {
        name: 'pubDate',
        pattern: /^.+$/  // https://en.wikipedia.org/wiki/Help:CS1_errors#bad_date
        // Citoid API has a fixDate function that deletes date if it cannot be converted to ISO
        // uses a custom version of the chrono library to parse
    },
    {
        name: 'language',
        pattern: /^.*$/  // Citoid API uses "fixLang" to validate language returned by Zotero
    }
]

export interface TranslationField {
    name: string;
    required: boolean;  // true for itemType and title; the rest are false by default and user defined
    array: boolean;  // whether the translation field expects an array of strings or not; if array not expected and array provided, join with ""
    pattern: RegExp;  // the pattern that the translation field should match; e.g., "/^$/", "/^.*$", "/^\d{4}(-\d{2}(-\d{2})?)?$", 
    citoidField: SimpleCitoidField;
    defaultTransformations: Array<Transformation>;
    validation: boolean;
}

// web2cit to use same item types as citoid
const ITEM_TYPES = [
    // https://aurimasv.github.io/z2csl/typeMap.xml
    "artwork",
    "attachment",
    "audioRecording",
    "bill",
    "blogPost",
    "book",
    "bookSection",
    "case",
    "computerProgram",
    "conferencePaper",
    "dictionaryEntry",
    "document",
    "email",
    "encyclopediaArticle",
    "film",
    "forumPost",
    "hearing",
    "instantMessage",
    "interview",
    "journalArticle",
    "letter",
    "magazineArticle",
    "manuscript",
    "map",
    "newspaperArticle",
    "note",
    "patent",
    "podcast",
    "presentation",
    "radioBroadcast",
    "report",
    "statute",
    "thesis",
    "tvBroadcast",
    "videoRecording",
    "webpage",
  ] as const;
export type ItemType = typeof ITEM_TYPES[number];
  