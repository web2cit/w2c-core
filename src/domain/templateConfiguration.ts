import {
  BaseTranslationTemplate,
  FallbackTemplate,
  TranslationTemplate,
} from "../templates/template";
import { FieldName } from "../translationField";
import { DomainConfiguration } from "./domainConfiguration";
import log from "loglevel";
import { Webpage } from "../webpage/webpage";
import {
  FallbackTemplateDefinition,
  TemplateDefinition,
  TemplateOutput,
} from "../types";

export class TemplateConfiguration extends DomainConfiguration<
  TranslationTemplate,
  TemplateDefinition
> {
  mandatoryFields: FieldName[];
  private templates: TranslationTemplate[];
  private _fallback: FallbackTemplate | undefined;
  constructor(
    domain: string,
    mandatoryFields: FieldName[] = [],
    fallback: FallbackTemplateDefinition | undefined,
    templates: TemplateDefinition[] = []
  ) {
    super(domain, "templates.json");
    this.templates = this.values;
    // set mandatory fields before loading configuration
    this.mandatoryFields = mandatoryFields;
    if (templates) this.loadConfiguration(templates);
    this.fallback = fallback;
  }

  get fallback(): FallbackTemplateDefinition | undefined {
    if (this._fallback !== undefined) {
      return this._fallback.toJSON();
    } else {
      return undefined;
    }
  }

  set fallback(definition: FallbackTemplateDefinition | undefined) {
    if (definition === undefined) {
      this._fallback = undefined;
    } else {
      this._fallback = new FallbackTemplate(
        this.domain,
        definition,
        this.mandatoryFields
      );
    }
  }

  get paths(): string[] {
    return this.templates.map((template) => template.path);
  }

  get(paths?: string | string[]): TranslationTemplate[] {
    let templates: TranslationTemplate[];
    if (paths === undefined) {
      // return all templates if no specific path specified
      templates = [...this.templates];
    } else {
      const pathArray = Array.isArray(paths) ? paths : [paths];
      templates = this.templates.filter((template) =>
        pathArray.includes(template.path)
      );
    }
    return templates;
  }

  // todo: do we want a method to edit a template
  // to make sure that the currentRevid is set to undefined upon changes?
  // how do we ensure that any template cache is not lost? see T302239

  add(definition: TemplateDefinition, index?: number): TranslationTemplate {
    // create template instance before checking if path already exists
    // because the template constructor may make changes to the path
    const newTemplate = new TranslationTemplate(
      this.domain,
      definition,
      this.mandatoryFields
    );
    if (this.templates.some((template) => template.path === newTemplate.path)) {
      throw new DuplicateTemplatePathError(definition.path);
    } else {
      if (index !== undefined) {
        this.templates.splice(index, 0, newTemplate);
      } else {
        this.templates.push(newTemplate);
      }
    }
    this.currentRevid = undefined;
    return newTemplate;
  }

  move(path: string, newIndex: number): void {
    const oldIndex = this.templates.findIndex(
      (template) => template.path === path
    );
    const template = this.templates.splice(oldIndex, 1)[0];
    if (template !== undefined) {
      this.templates.splice(newIndex, 0, template);
      this.currentRevid = undefined;
    }
  }

  remove(path: string): void {
    const index = this.templates.findIndex(
      (template) => template.path === path
    );
    if (index > -1) {
      this.templates.splice(index, 1);
      log.info(
        `Template for path ${path} at index ${index} successfully removed`
      );
    } else {
      log.info(`Could not remove template for path ${path}. No template found`);
    }
  }

  loadConfiguration(templates: TemplateDefinition[]): void {
    if (this.mandatoryFields === undefined) {
      throw new Error(
        "Mandatory template fields must be defined before loading any template configuration"
      );
    }
    // fixme?: wiping previous translation templates erases template caches
    // see T302239
    this.templates = [];
    // silently ignore duplicate
    templates.forEach((definition) => {
      try {
        this.add(definition);
      } catch (e) {
        if (e instanceof DuplicateTemplatePathError) {
          // silently ignore duplicate template paths
          log.info(`Skipping duplicate templates for path ${definition.path}`);
        } else {
          // fixme: catch unsupported field names and
          // selection/transformation types and values
          throw e;
        }
      }
    });
  }

  async translateWith(
    target: Webpage,
    paths: string[],
    options: {
      useFallback?: boolean;
      preferSamePath?: boolean;
      tryAllTemplates?: boolean;
    }
  ): Promise<TemplateOutput[]> {
    // defaults
    if (options.useFallback === undefined) options.useFallback = true;
    if (options.preferSamePath === undefined) options.preferSamePath = true;
    if (options.tryAllTemplates === undefined) options.tryAllTemplates = false;

    const templates: BaseTranslationTemplate[] = this.get(paths);
    if (options.preferSamePath) {
      const targetPathTemplateIndex = templates.findIndex(
        (template) => template.path === target.path
      );
      const targetPathTemplate = templates[targetPathTemplateIndex];
      if (targetPathTemplate !== undefined) {
        templates.splice(targetPathTemplateIndex, 1);
        templates.unshift(targetPathTemplate);
      }
    }

    if (options.useFallback && this._fallback) {
      templates.push(this._fallback);
    }

    let outputs: TemplateOutput[];
    if (options.tryAllTemplates) {
      outputs = await Promise.all(
        templates.map((template) => template.translate(target))
      );
    } else {
      outputs = [];
      for (const template of templates) {
        // todo: catch errors?
        const output = await template.translate(target);
        if (output.applicable) {
          outputs.push(output);
          break;
        }
      }
    }
    return outputs;
  }
}

export class DuplicateTemplatePathError extends Error {
  constructor(path: string) {
    super(`There is a template for path ${path} already`);
    this.name = "Duplicate template path error";
  }
}
