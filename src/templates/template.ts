import { Webpage } from "../webpage";
import {
  TemplateField,
  TemplateFieldDefinition,
  TemplateFieldOutput,
} from "./templateField";

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
    this.domain = domain;
    this.path = template.path;
    this.template = new Webpage(this.domain + this.path);
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
    // todo: make sure no more than two unique fields with equal name
    this._fields = fields;
  }

  async translate(target: Webpage): Promise<TranslationOutput> {
    // todo: refuse translation of target for different domain
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
