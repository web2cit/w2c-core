import {
    Selection,
    CitoidSelection
} from './selection';
import { fields, TranslationField } from './fields';
import {
    Transformation
} from './transformation';

export class Procedure {
    field: TranslationField;
    selection: Array<Selection>;
    transformation: Array<Transformation>;
    finalJoin:; // mandatory final join transformation;
    finalMatch:; // mandatory final item-wise match transformation
    validation: boolean;

    constructor(
        field: TranslationField,
        selection: Array<Selection> = [],
        transformation: Array<Transformation> = []
    ) {
        this.field = field;
        this.selection = selection;
        this.transformation = field.defaultTransformations;
        this.validation = field.validation
    }

    translate(targetUrl): ProcedureOutput => {  // similar to wider TranslationOutput
        const translation: FieldTranslation = {
            selection: [],
            transformation: [],
            valid: 
        }
        // apply selection
        // should selection objects know their output?

        // apply transformation
        // idem above

        // decide if output is valid

        // 
    }
}

interface ProcedureOutput {
    targetUrl;
    procedure; // a copy of the translation procedure?
    field;
    output: {
        selectionOutput; // an array of selection outputs
        transformationOutput; // an array of transformation outputs
        procedureOutput;
    };
    valid;
}

