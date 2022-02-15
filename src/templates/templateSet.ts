import { DomainNameError, isDomain } from "../domain";
import { Webpage } from "../webpage";
import {
  FallbackTemplateDefinition,
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
    fallbackTemplate?: FallbackTemplateDefinition
  ) {
    if (!isDomain(domain)) {
      throw new DomainNameError(domain);
    }
    if (fallbackTemplate && "path" in fallbackTemplate) {
      throw new Error("Fallback template should not have template path");
    }
    const duplicatePaths = TemplateSet.getDuplicatePaths(templates);
    if (duplicatePaths.length) {
      throw new Error(
        `Multiple templates provided for paths: ${duplicatePaths.join(", ")}`
      );
    }
    this.domain = domain;
    this.templates = templates.map(
      (template) => new TranslationTemplate(this.domain, template)
    );
    if (fallbackTemplate) {
      this.fallback = new TranslationTemplate(this.domain, fallbackTemplate);
    }
  }

  async translate(target: Webpage): Promise<TemplateOutput | false> {
    const templates = [...this.templates];
    if (this.fallback) templates.push(this.fallback);

    // prefer a template for the same path as the target
    const targetPathTemplateIndex = templates.findIndex(
      (template) => template.path === target.path
    );
    const targetPathTemplate = templates[targetPathTemplateIndex];
    if (targetPathTemplate !== undefined) {
      templates.splice(targetPathTemplateIndex, 1);
      templates.unshift(targetPathTemplate);
    }

    for (const template of templates) {
      // todo: catch errors?
      const output = await template.translate(target);
      if (output.applicable) return output;
    }
    return false;
  }

  static getDuplicatePaths(templates: TemplateDefinition[]): string[] {
    const paths: string[] = [];
    const duplicatePaths = [];
    for (const path of templates.map((template) => template.path)) {
      if (paths.includes(path)) {
        duplicatePaths.push(path);
      } else {
        paths.push(path);
      }
    }
    return duplicatePaths;
  }
}
