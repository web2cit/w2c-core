import { FieldName } from "../translationField";
import { Webpage } from "../webpage";
import {
  TemplateField,
  TemplateFieldDefinition,
  TemplateFieldOutput,
} from "./templateField";
import log from "loglevel";
import { isDomain, DomainNameError } from "../domain";

export class TranslationTemplate {
  readonly domain: string;
  // a fallback template does not have a path
  readonly template?: Webpage;
  label: string;
  private forceRequiredFields: Array<FieldName>;
  private _fields: Array<TemplateField> = [];
  constructor(
    domain: string,
    template: TemplateDefinition | FallbackTemplateDefinition,
    forceRequiredFields: Array<FieldName> = []
  ) {
    if (!isDomain(domain)) {
      throw new DomainNameError(domain);
    }
    this.domain = domain;
    this.forceRequiredFields = forceRequiredFields;

    if ("path" in template) {
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

  get path() {
    return this.template && this.template.path;
  }

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
      timestamp: new Date(),
      template: this,
    };
  }

  toJSON(): TemplateDefinition | undefined {
    if (this.template === undefined) {
      // fallback templates without a template path should not be printed
      return;
    }
    return {
      path: this.template.path,
      fields: this.fields.map((field) => field.toJSON()),
      label: this.label,
    };
  }
}

export interface TemplateOutput {
  target: Webpage;
  outputs: Array<TemplateFieldOutput>;
  applicable: boolean;
  timestamp: Date;
  template: TranslationTemplate;
}

export interface TemplateDefinition {
  // path is mandatory for template definition
  // fallback templates (without a path) should not have a definition
  path: string;
  fields?: Array<TemplateFieldDefinition>;
  label?: string;
}

export type FallbackTemplateDefinition = Omit<TemplateDefinition, "path">;

class DuplicateUniqueFieldError extends Error {
  constructor(fieldname: string) {
    super(`Unique template ${fieldname} already exists in template`);
    this.name = "Duplicate unique field error";
  }
}
