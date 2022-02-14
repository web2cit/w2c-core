import { DomainNameError, isDomain } from "../domain";
import { Webpage } from "../webpage";
import {
  TemplateDefinition,
  TemplateOutput,
  TranslationTemplate,
} from "./template";

export class TemplateSet {
  domain: string;
  templates: Array<TranslationTemplate>;
  fallback: TranslationTemplate | undefined;
  constructor(
    domain: string,
    templates: Array<TemplateDefinition> = [],
    fallbackTemplate?: Partial<TemplateDefinition>
  ) {
    if (!isDomain(domain)) {
      throw new DomainNameError(domain);
    }
    if (fallbackTemplate && fallbackTemplate.path) {
      throw new Error("Fallback template should not have template path");
    }
    this.domain = domain;
    this.templates = templates.map(
      (template) => new TranslationTemplate(this.domain, template)
    );
    this.fallback = new TranslationTemplate(this.domain, fallbackTemplate);
  }

  async translate(target: Webpage): Promise<TemplateOutput | false> {
    const templates = [...this.templates];
    // confirm we are not copying the templates
    if (this.fallback) templates.push(this.fallback);
    for (let i = 0; i < templates.length; i++) {
      const template = templates[i];
      // catch errors?
      const output = await template.translate(target);
      if (output.applicable) return output;
    }
    return false;
  }
}
