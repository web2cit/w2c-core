import { FieldName } from "../translationField";
import { Webpage } from "../webpage";
import {
  TemplateField,
  TemplateFieldDefinition,
  TemplateFieldOutput,
} from "./templateField";
import log from "loglevel";

export class TranslationTemplate {
  domain: string;
  path: string;
  template: Webpage;
  label: string;
  private _fields: Array<TemplateField> = [];
  constructor(
    domain: string,
    template: Pick<TemplateDefinition, "path"> & Partial<TemplateDefinition>
  ) {
    const url = domain + template.path;
    try {
      this.template = new Webpage(url);
    } catch {
      throw new Error(
        "Could not create a Webpage object for the URL " +
          "formed by the domain and path provided: " +
          url
      );
    }
    this.domain = this.template.domain;
    this.path = this.template.path;
    this.label = template.label ?? "";
    if (template.fields)
      this.fields = template.fields.map((field) => {
        return new TemplateField(field);
      });
  }

  get fields(): TranslationTemplate["_fields"] {
    return this._fields;
  }

  set fields(fields: TranslationTemplate["_fields"]) {
    const uniqueFields: Array<FieldName> = [];
    this._fields = fields.reduce((dedupFields: Array<TemplateField>, field) => {
      if (field.isUnique && uniqueFields.includes(field.name)) {
        // consider alternatives, such as winston, debug, and console.info
        log.info(`Skipping duplicate unique field "${field.name}"`);
      } else {
        if (field.isUnique) {
          uniqueFields.push(field.name);
        }
        dedupFields.push(field);
      }
      return dedupFields;
    }, []);
  }

  async translate(target: Webpage): Promise<TranslationOutput> {
    if (target.domain !== this.domain) {
      throw new Error(
        `Template for ${this.domain} cannot translate target at ${target.domain}`
      );
    }
    const outputs = await Promise.all(
      this.fields.map((field) => field.translate(target))
    );
    return {
      target,
      outputs,
      applicable: outputs.every((output) => output.applicable),
      timestamp: new Date(),
      template: this,
    };
  }
}

interface TranslationOutput {
  target: Webpage;
  outputs: Array<TemplateFieldOutput>;
  applicable: boolean;
  timestamp: Date;
  template: TranslationTemplate;
}

interface TemplateDefinition {
  path: string;
  label: string;
  fields: Array<TemplateFieldDefinition>;
}
