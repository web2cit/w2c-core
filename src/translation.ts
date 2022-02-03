// web2cit to use same item types as citoid
export const ITEM_TYPES = [
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
  