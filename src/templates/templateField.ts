import { TargetUrl } from "../targetUrl";
import {
  ProcedureOutput,
  TranslationProcedure,
  TranslationProcedureDefinition,
} from "./procedure";
import { FieldName, TranslationField } from "../translationField";

export class TemplateField extends TranslationField {
  procedure: TranslationProcedure;
  private _required: boolean;
  // parameter shortcuts
  readonly forceRequired: boolean;
  readonly isUnique: boolean;
  constructor(field: FieldName | TemplateFieldDefinition) {
    let fieldname;
    let procedure;
    let required = false;
    if (field instanceof Object) {
      ({ fieldname, procedure, required } = field);
    } else {
      fieldname = field;
    }
    super(fieldname);
    this.forceRequired = this.params.forceRequired;
    // if force-required field, ignore field definition's required setting
    this._required = this.forceRequired || required || false;
    this.isUnique = this.params.unique;
    this.procedure = new TranslationProcedure(
      procedure || this.params.defaultProcedure
    );
  }

  get required() {
    return this._required;
  }
  set required(required: boolean) {
    if (!required && this.forceRequired) {
      throw new Error("Cannot make force-required field non-required!");
    } else {
      this._required = required;
    }
  }

  translate(target: TargetUrl): Promise<TemplateFieldOutput> {
    return this.procedure.translate(target).then((procedureOutput) => {
      const output = this.validate(procedureOutput.output.procedure);
      const valid = output.every((value) => value !== null);
      const fieldOutput: TemplateFieldOutput = {
        fieldname: this.name,
        required: this.required,
        procedureOutput: procedureOutput,
        output,
        valid,
        applicable: valid || !this.required,
      };
      return fieldOutput;
    });
  }

  private validate(
    output: ProcedureOutput["output"]["procedure"]
  ): Array<string | null> {
    if (!this.isArray) {
      // alternatively, consider:
      // a. keep first element only
      // b. return [null] (invalid)
      output = [output.join()];
    }
    const validatedOutput = output.map((output) => {
      output = output.trim();
      return this.pattern.test(output) ? output : null;
    });
    return validatedOutput;
  }
}

interface TemplateFieldOutput {
  fieldname: FieldName;
  procedureOutput: ProcedureOutput;
  output: Array<string | null>;
  valid: boolean; // whether all
  required: boolean;
  applicable: boolean; // valid || !required
}

export interface TemplateFieldDefinition {
  fieldname: FieldName;
  procedure: TranslationProcedureDefinition;
  required: boolean;
}
