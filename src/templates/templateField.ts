import { Webpage } from "../webpage/webpage";
import { TranslationProcedure } from "./procedure";
import { FieldName, isItemType, TranslationField } from "../translationField";
import { MediaWikiBaseFieldCitation, MediaWikiCreator } from "../citoid";
import {
  TemplateFieldDefinition,
  TemplateFieldOutput,
  ProcedureOutput,
  ProcedureDefinition,
} from "../types";
export class TemplateField extends TranslationField {
  procedures: TranslationProcedure[];
  private _required: boolean;
  // parameter shortcuts
  readonly forceRequired: boolean;
  readonly isControl: boolean;
  constructor(
    field: TemplateFieldDefinition | FieldName,
    loadDefaults = false
  ) {
    let fieldname: FieldName;
    let procedures: ProcedureDefinition[];
    let required = false;
    if (field instanceof Object) {
      ({ fieldname, procedures, required } = field);
    } else {
      fieldname = field;
      procedures = [];
    }
    super(fieldname);
    if (loadDefaults) {
      procedures = [this.params.defaultProcedure];
    }
    this.forceRequired = this.params.forceRequired;
    // if force-required field, ignore field definition's required setting
    this._required = this.forceRequired || required || false;
    this.isControl = this.params.control;
    this.procedures = procedures.map(
      (procedure) => new TranslationProcedure(procedure)
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

  async translate(target: Webpage): Promise<TemplateFieldOutput> {
    const procedureOutputs = await Promise.all(
      this.procedures.map((procedure) => procedure.translate(target))
    );
    const combinedOutput = ([] as string[]).concat(
      ...procedureOutputs.map((output) => output.output.procedure)
    );
    const output = this.validate(combinedOutput);
    const valid = output.length > 0 && output.every((value) => value !== null);
    const fieldOutput: TemplateFieldOutput = {
      fieldname: this.name,
      required: this.required,
      procedureOutputs: procedureOutputs,
      output,
      valid,
      applicable: valid || !this.required,
      control: this.isControl,
    };
    return fieldOutput;
  }

  toJSON(): TemplateFieldDefinition {
    return {
      fieldname: this.name,
      required: this.required,
      procedures: this.procedures.map((procedure) => procedure.toJSON()),
    };
  }

  private validate(
    output: ProcedureOutput["output"]["procedure"]
  ): Array<string | null> {
    if (!this.isArray && output.length) {
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

export function outputToCitation(
  fieldOutputs: Array<TemplateFieldOutput>
): Partial<
  Pick<
    MediaWikiBaseFieldCitation,
    | "itemType"
    | "author"
    | "title"
    | "date"
    | "language"
    | "publicationTitle"
    | "code"
    | "reporter"
    | "publisher"
  >
> {
  const fields: Map<FieldName, string[]> = new Map();
  for (const field of fieldOutputs) {
    // ignore invalid and control fields
    if (field.valid && !field.control) {
      const fieldName = field.fieldname;
      // fixme: reconsider whether field output should accept null values
      // see T302024
      if (field.output.some((value) => value === null)) {
        throw new Error(`Unexpected non-string value in valid field output`);
      }
      fields.set(fieldName, field.output as string[]);
    }
  }

  const authorLast = fields.get("authorLast");
  const authorFirst = fields.get("authorFirst");
  // the length of the authors array will be that of the authorLast array
  // extra first names in the firstName array will be ignored
  const author =
    authorLast &&
    authorLast.reduce((author: MediaWikiCreator[], lastName, index) => {
      // replace missing first names with ""
      const firstName = authorFirst?.at(index) ?? "";
      author.push([firstName, lastName]);
      return author;
    }, []);

  // fixme: below we generally assume that:
  // - non-array fields would output a single-value array
  // - controlled-string fields would output a valid value (e.g., itemType)
  // consider fixing by having separate field subclasses,
  // each with a specific output type: string | string[] | ItemType | etc

  const itemType = fields.get("itemType")?.at(0);
  if (itemType !== undefined && !isItemType(itemType)) {
    throw new Error(`${itemType} is not a valid value for field "itemType"`);
  }
  return {
    itemType,
    author,
    title: fields.get("itemType")?.at(0),
    date: fields.get("date")?.at(0),
    language: fields.get("language")?.at(0),
    // CSL container-title fields
    publicationTitle: fields.get("publishedIn")?.at(0),
    code: fields.get("publishedIn")?.at(0),
    reporter: fields.get("publishedIn")?.at(0),
    // CSL publisher field
    publisher: fields.get("publishedBy")?.at(0),
  };
}
