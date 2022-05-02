import { Webpage } from "../webpage/webpage";
import { TranslationProcedure } from "./procedure";
import { FieldName, isItemType, TranslationField } from "../translationField";
import { MediaWikiBaseFieldCitation } from "../citation/citationTypes";
import { MediaWikiCreator } from "../citation/valueTypes";
import {
  TemplateFieldDefinition,
  TemplateFieldOutput,
  ProcedureDefinition,
} from "../types";
import log from "loglevel";
export class TemplateField extends TranslationField {
  procedures: TranslationProcedure[];
  private _required: boolean;
  // parameter shortcuts
  readonly forceRequired: boolean;
  readonly isControl: boolean;
  constructor(
    field: TemplateFieldDefinition | FieldName,
    {
      loadDefaults = false,
      strict = true,
    }: {
      loadDefaults?: boolean;
      strict?: boolean;
    } = {}
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
    this.procedures = procedures.reduce(
      (procedures: TranslationProcedure[], procedure, index) => {
        try {
          procedures.push(new TranslationProcedure(procedure, { strict }));
        } catch (e) {
          if (!strict) {
            log.warn(
              `In "${this.name}" template field, ` +
                `failed to parse #${index} procedure definition: ${e})`
            );
          } else {
            throw e;
          }
        }
        return procedures;
      },
      []
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
    let combinedOutput = ([] as string[]).concat(
      ...procedureOutputs.map((output) => output.output.procedure)
    );

    // if field does not expect an array for output, join output values
    if (!this.isArray && combinedOutput.length > 0) {
      combinedOutput = [combinedOutput.join()];
    }

    combinedOutput = combinedOutput.map((value) => value.trim());

    const valid = this.validate(combinedOutput);

    const fieldOutput: TemplateFieldOutput = {
      fieldname: this.name,
      required: this.required,
      procedureOutputs: procedureOutputs,
      output: combinedOutput,
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

  private validate(output: TemplateFieldOutput["output"]): boolean {
    const valid =
      output.length > 0 && output.every((value) => this.pattern.test(value));
    return valid;
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
      const firstName = authorFirst?.[index] ?? "";
      author.push([firstName, lastName]);
      return author;
    }, []);

  // fixme: below we generally assume that:
  // - non-array fields would output a single-value array
  // - controlled-string fields would output a valid value (e.g., itemType)
  // consider fixing by having separate field subclasses,
  // each with a specific output type: string | string[] | ItemType | etc

  const itemType = fields.get("itemType")?.[0];
  if (itemType !== undefined && !isItemType(itemType)) {
    throw new Error(`${itemType} is not a valid value for field "itemType"`);
  }
  return {
    itemType,
    author,
    title: fields.get("title")?.[0],
    date: fields.get("date")?.[0],
    language: fields.get("language")?.[0],
    // CSL container-title fields
    publicationTitle: fields.get("publishedIn")?.[0],
    code: fields.get("publishedIn")?.[0],
    reporter: fields.get("publishedIn")?.[0],
    // CSL publisher field
    publisher: fields.get("publishedBy")?.[0],
  };
}
