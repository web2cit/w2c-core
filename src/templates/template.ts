import { FieldName } from "../translationField";
import { Webpage } from "../webpage/webpage";
import { TemplateField } from "./templateField";
import log from "loglevel";
import { isDomainName, DomainNameError } from "../domain/domain";
import {
  FallbackTemplateDefinition,
  TemplateDefinition,
  TemplateOutput,
} from "../types";
export abstract class BaseTranslationTemplate {
  readonly domain: string;
  abstract template?: Webpage;
  label: string;
  private forceRequiredFields: Array<FieldName>;
  private _fields: Array<TemplateField> = [];
  protected constructor(
    domain: string,
    template: TemplateDefinition | FallbackTemplateDefinition,
    forceRequiredFields: Array<FieldName> = []
  ) {
    if (!isDomainName(domain)) {
      throw new DomainNameError(domain);
    }
    this.domain = domain;
    this.forceRequiredFields = forceRequiredFields;
    this.label = template.label ?? "";
    if (template.fields) {
      template.fields.forEach((definition) => {
        const field = new TemplateField(definition);
        try {
          this.addField(field);
        } catch (e) {
          if (e instanceof DuplicateUniqueFieldError) {
            log.info(`Skipping duplicate unique field "${field.name}"`);
          } else {
            throw e;
          }
        }
      });
    }
  }

  get fields(): ReadonlyArray<TemplateField> {
    return Object.freeze([...this._fields]);
  }

  addField(newField: TemplateField) {
    if (
      newField.isUnique &&
      this._fields.some((field) => field.name === newField.name)
    ) {
      throw new DuplicateUniqueFieldError(newField.name);
    } else {
      this._fields.push(newField);
    }
  }

  removeField(name: FieldName, order?: number) {
    if (this.forceRequiredFields.includes(name)) {
      throw new Error(`Cannot remove forced-required field ${name}`);
    }
    const indices = this._fields.reduce((indices: number[], field, index) => {
      if (field.name === name) indices.push(index);
      return indices;
    }, []);
    const index = indices.at(order ?? -1);
    if (index !== undefined) this._fields.splice(index, 1);
  }

  abstract get path(): string | undefined;

  async translate(target: Webpage): Promise<TemplateOutput> {
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
      timestamp: new Date().toISOString(),
      template: this,
    };
  }

  toJSON(): TemplateDefinition | FallbackTemplateDefinition {
    return {
      fields: this.fields.map((field) => field.toJSON()),
      label: this.label,
    };
  }
}

export class TranslationTemplate extends BaseTranslationTemplate {
  readonly template: Webpage;
  constructor(
    domain: string,
    template: TemplateDefinition,
    forceRequiredFields: Array<FieldName> = []
  ) {
    super(domain, template, forceRequiredFields);
    const url = "http://" + this.domain + template.path;
    try {
      this.template = new Webpage(url);
    } catch {
      throw new Error(
        "Could not create a Webpage object for the URL " +
          "formed by the domain and path provided: " +
          url
      );
    }
  }

  get path() {
    return this.template.path;
  }

  toJSON(): TemplateDefinition {
    return {
      ...super.toJSON(),
      path: this.path,
    };
  }
}

export class FallbackTemplate extends BaseTranslationTemplate {
  template: undefined;
  constructor(
    domain: string,
    template: FallbackTemplateDefinition,
    forceRequiredFields: Array<FieldName> = []
  ) {
    if ("path" in template) {
      throw new Error("Fallback template should not have template path");
    }
    super(domain, template, forceRequiredFields);
  }
  get path() {
    return undefined;
  }
}

class DuplicateUniqueFieldError extends Error {
  constructor(fieldname: string) {
    super(`Unique template ${fieldname} already exists in template`);
    this.name = "Duplicate unique field error";
  }
}
