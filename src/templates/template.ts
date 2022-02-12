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
  domain: string;
  // a fallback template does not have a path
  template?: Webpage;
  label: string;
  private _fields: Array<TemplateField> = [];
  constructor(domain: string, template: Partial<TemplateDefinition> = {}) {
    if (!isDomain(domain)) {
      throw new DomainNameError(domain);
    }
    this.domain = domain;
    this.path = template.path;
    this.label = template.label ?? "";
    if (template.fields) {
      this.fields = template.fields.map((field) => {
        return new TemplateField(field);
      });
    }
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

  get path() {
    return this.template && this.template.path;
  }

  set path(path: string | undefined) {
    if (path) {
      const url = "http://" + this.domain + path;
      try {
        this.template = new Webpage(url);
      } catch {
        throw new Error(
          "Could not create a Webpage object for the URL " +
            "formed by the domain and path provided: " +
            url
        );
      }
    } else {
      this.template = undefined;
    }
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

interface TranslationOutput {
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
  label: string;
  fields: Array<TemplateFieldDefinition>;
}
