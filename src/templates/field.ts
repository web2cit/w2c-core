import { TargetUrl } from "../targetUrl";
import {
    makeProcedure,
    TranslationProcedure,
    TranslationProcedureDefinition
} from "./procedure";
import { ITEM_TYPES } from "../translation";

const FIELD_NAMES = [
    "itemType",
    "title",
    "authorFirst",
    "authorLast",
    "pubDate",
    "source",
    "control",
    "lang"
] as const;
type FieldName = typeof FIELD_NAMES[number];
interface FieldSettings {
    array: boolean;
    forceRequired: boolean;
    pattern: RegExp;
    // todo: the procedures module should have a getProcedure function
    // that understands this syntax (same as in templates file)
    // and returns a procedure object
    // same with getSelection and getTransformation
    defaultProcedure: TranslationProcedureDefinition;
    // the template object above in the hierarchy should ensure there are no two unique fields with same name
    unique: boolean;
}
const fieldSettings: Record<FieldName, FieldSettings> = {
    itemType: {
        array: false,
        forceRequired: true,
        pattern: new RegExp(`^${ITEM_TYPES.join('|')}$`),
        defaultProcedure: {
            selection: [{type: "citoid", value: "itemType"}],
            transformation: []
        },
        unique: true
    },
    title: {
        array: false,
        forceRequired: true,
        pattern: /^.+$/,
        defaultProcedure: {
            selection: [{type: "citoid", value: "title"}],
            transformation: []
        },
        unique: true
    },
    authorFirst: {
        array: true,
        forceRequired: false,
        pattern: /^.*$/,  // allow empty strings as author first names
        defaultProcedure: {
            selection: [{type: "citoid", value: "authorFirst"}],
            transformation: []
        },
        unique: true
    },
    authorLast: {
        array: true,
        forceRequired: false,
        pattern: /^.+$/,  // do not allow empty strings as author last names
        defaultProcedure: {
            selection: [{type: "citoid", value: "authorLast"}],
            transformation: []
        },
        unique: true
    },
    pubDate: {
        array: false,
        forceRequired: false,
        // todo: handle negative and 1-3-digit years
        pattern: /^\d{4}(-\d{2}(-\d{2})?)?$/,
        defaultProcedure: {
            selection: [{type: "citoid", value: "date"}],
            transformation: [{type: "date", value: "en", itemwise: false}]
        },
        unique: true
    },
    source: {
        array: false,
        forceRequired: false,
        pattern: /^.+$/,
        defaultProcedure: {
            selection: [
                // items may have one of publicationTitle, code OR reporter
                // (representing "container-title")
                // and may or may not have publisher
                {type: "citoid", value: "publicationTitle"},
                {type: "citoid", value: "code"},
                {type: "citoid", value: "reporter"},
                {type: "citoid", value: "publisher"}
            ],
            transformation: [
                // if container-title, keep that. otherwise, use publisher
                {type: "range", value: "0", itemwise: false}
            ]
        },
        unique: true
    },
    control: {
        array: false,
        forceRequired: true,  // control fields should be required by definition
        pattern: /^.*$/,
        defaultProcedure: {
            selection: [],
            transformation: []  // a match transformation may be recommended
        },
        unique: false  // multiple control fields may be defined
    },
    lang: {
        array: false,
        forceRequired: false,
        pattern: /^[a-z]{2}(?:-?[a-z]{2,})*$/i,  // from Citoid's fixLang()
        defaultProcedure: {
            selection: [{type: "citoid", value: "language"}],
            transformation: []
        },
        unique: true,
    }
}

export class TranslationField {
    readonly name: FieldName;
    readonly isArray: boolean;
    readonly forceRequired: boolean;
    readonly pattern: RegExp;
    readonly isUnique: boolean
    procedure: TranslationProcedure;
    private _required: boolean;
    constructor(field: TranslationFieldDefinition) {
        const settings = fieldSettings[field.fieldname];
        if (settings === undefined) {
            throw new Error(`Field name ${field.fieldname} not supported`);
        }
        this.name = field.fieldname;
        this.isArray = settings.array;
        this.forceRequired = settings.forceRequired;
        this.pattern = settings.pattern;
        this.isUnique = settings.unique;
        let procedure = field.procedure || settings.defaultProcedure;
        this.procedure = new TranslationProcedure(procedure);
    }

    get required() { return this._required };
    set required(required: boolean) {
        if (!required && this.forceRequired) {
            throw new Error('Cannot make force-required field non-required!');
        } else {
            this._required = required;
        }
    }

    translate(target: TargetUrl): Promise<FieldOutput> {
        // pass the target to the procedure and save the output

        // set the field output by using the config join value

        // possibly, automatically trim all output values

        // decide if the output is valid by checking all elements against the pattern

        // optionally, if not valid fallback to default procedure

    }
}

interface FieldTranslationOutput {
    fieldname: FieldName;
    procedureOutput: ProcedureOutput;
    output: Array<
        {
            value: string;
            valid: boolean
        }
    >;
    valid: boolean;  // whether all 
    required: boolean;
    applicable: boolean // valid || !required
}

export function getField() {

}

export interface TranslationFieldDefinition {
    fieldname: FieldName;
    procedure: TranslationProcedureDefinition;
}