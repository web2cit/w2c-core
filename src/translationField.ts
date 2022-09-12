import { ProcedureDefinition, StepOutput } from "./types";
const FIELD_NAMES = [
  "itemType",
  "title",
  "authorFirst",
  "authorLast",
  "date",
  "publishedIn",
  "publishedBy",
  "control",
  "language",
] as const;
export type FieldName = typeof FIELD_NAMES[number];
export function isFieldName(fieldname: unknown): fieldname is FieldName {
  return FIELD_NAMES.includes(fieldname as FieldName);
}

interface FieldParameters {
  array: boolean;
  forceRequired: boolean;
  pattern: RegExp;
  // todo: the procedures module should have a getProcedure function
  // that understands this syntax (same as in templates file)
  // and returns a procedure object
  // same with getSelection and getTransformation
  defaultProcedure: ProcedureDefinition;

  // control field is the only which is control
  // and it can't be used as a TestField
  // we may remove from here and define in TemplateField
  // but it may be useful to have all possible fields in this file

  control: boolean; // output of control fields should be ignored
}

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
export function isItemType(itemType: string): itemType is ItemType {
  return ITEM_TYPES.includes(itemType as ItemType);
}

export class TranslationField {
  private static params: Record<FieldName, FieldParameters> = {
    itemType: {
      array: false,
      forceRequired: true,
      pattern: new RegExp(`^${ITEM_TYPES.join("|")}$`),
      defaultProcedure: {
        selections: [{ type: "citoid", config: "itemType" }],
        transformations: [],
      },
      control: false,
    },
    title: {
      array: false,
      forceRequired: true,
      pattern: /^.+$/,
      defaultProcedure: {
        selections: [{ type: "citoid", config: "title" }],
        transformations: [],
      },
      control: false,
    },
    authorFirst: {
      array: true,
      forceRequired: false,
      pattern: /^.*$/, // allow empty strings as author first names
      defaultProcedure: {
        selections: [{ type: "citoid", config: "authorFirst" }],
        transformations: [],
      },
      control: false,
    },
    authorLast: {
      array: true,
      forceRequired: false,
      pattern: /^.+$/, // do not allow empty strings as author last names
      defaultProcedure: {
        selections: [{ type: "citoid", config: "authorLast" }],
        transformations: [],
      },
      control: false,
    },
    date: {
      array: false,
      forceRequired: false,
      // todo: handle negative and 1-3-digit years
      pattern: /^\d{4}(-\d{2}(-\d{2})?)?$/,
      defaultProcedure: {
        selections: [{ type: "citoid", config: "date" }],
        transformations: [{ type: "date", config: "en", itemwise: false }],
      },
      control: false,
    },
    publishedIn: {
      array: false,
      forceRequired: false,
      pattern: /^.+$/,
      defaultProcedure: {
        selections: [
          // items may have one of publicationTitle, code OR reporter
          // (representing "container-title")
          { type: "citoid", config: "publicationTitle" },
          { type: "citoid", config: "code" },
          { type: "citoid", config: "reporter" },
        ],
        transformations: [{ type: "range", config: "1", itemwise: false }],
      },
      control: false,
    },
    publishedBy: {
      array: false,
      forceRequired: false,
      pattern: /^.+$/,
      defaultProcedure: {
        selections: [{ type: "citoid", config: "publisher" }],
        transformations: [],
      },
      control: false,
    },
    control: {
      array: false,
      forceRequired: true, // control fields should be required by definition
      pattern: /^.*$/,
      defaultProcedure: {
        selections: [],
        transformations: [], // a match transformation may be recommended
      },
      control: true,
    },
    language: {
      array: false,
      forceRequired: false,
      pattern: /^[a-z]{2}(?:-?[a-z]{2,})*$/i, // from Citoid's fixLang()
      defaultProcedure: {
        selections: [{ type: "citoid", config: "language" }],
        transformations: [],
      },
      control: false,
    },
  };
  readonly name: FieldName;
  readonly params: FieldParameters;
  // parameter shortcuts
  readonly isArray: boolean;
  readonly pattern: RegExp;

  constructor(name: FieldName, params?: FieldParameters) {
    this.params = params || TranslationField.params[name];
    if (this.params == undefined) {
      throw new Error(`No field parameters available for field name ${name}`);
    }
    this.name = name;
    this.isArray = this.params.array;
    this.pattern = this.params.pattern;
  }

  validate(output: StepOutput, allowEmpty = false): boolean {
    const valid =
      (output.length > 0 || allowEmpty) &&
      output.every((value) => this.pattern.test(value));
    return valid;
  }
}
