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
import { normalizeUrlPath } from "../utils";

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
      const pathArray = (Array.isArray(paths) ? paths : [paths]).map(
        normalizeUrlPath
      );

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
    const newTemplate = new TranslationTemplate(this.domain, definition, {
      forceRequiredFields: this.mandatoryFields,
    });
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
      (template) => template.path === normalizeUrlPath(path)
    );
    const template = this.templates.splice(oldIndex, 1)[0];
    if (template !== undefined) {
      this.templates.splice(newIndex, 0, template);
      this.currentRevid = undefined;
    }
  }

  remove(path: string): void {
    const index = this.templates.findIndex(
      (template) => template.path === normalizeUrlPath(path)
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

  parse(content: string): TemplateDefinition[] {
    let definitions;
    try {
      definitions = JSON.parse(content) as unknown;
    } catch {
      throw new Error("Not a valid JSON");
    }
    if (!(definitions instanceof Array)) {
      throw new Error("Template configuration should be an array of templates");
    }
    const templateDefinitions = definitions.reduce(
      (templateDefinitions: TemplateDefinition[], definition, index) => {
        // to address T305267, instead of using isTemplateDefinition,
        // create template from definition, skipping individual invalid elements
        // and convert back to json
        try {
          const template = new TranslationTemplate(this.domain, definition, {
            forceRequiredFields: this.mandatoryFields,
            strict: false,
          });
          templateDefinitions.push(template.toJSON());
        } catch (error) {
          let info = "Ignoring misformatted template";
          if ("path" in definition) {
            info = info + ` for path "${definition.path}"`;
          } else {
            info = info + ` at index ${index}`;
          }
          log.warn(info + `: ${error}`);
        }
        return templateDefinitions;
      },
      []
    );
    return templateDefinitions;
  }

  loadConfiguration(templates: TemplateDefinition[]): void {
    // fixme?: wiping previous translation templates erases template caches
    // see T302239

    // wipe array without removing reference to this.values
    this.templates.length = 0;
    templates.forEach((definition) => {
      try {
        this.add(definition);
      } catch (e) {
        if (e instanceof DuplicateTemplatePathError) {
          // silently ignore duplicate template paths
          log.info(`Skipping duplicate templates for path ${definition.path}`);
        } else {
          throw e;
        }
      }
    });
  }

  async translateWith(
    target: Webpage,
    paths: string[],
    {
      useFallback = true,
      preferSamePath = true,
      tryAllTemplates = false,
      onlyApplicable = true,
    } = {}
  ): Promise<TemplateOutput[]> {
    const templates: BaseTranslationTemplate[] = this.get(paths);
    if (preferSamePath) {
      const targetPathTemplateIndex = templates.findIndex(
        (template) => template.path === target.path
      );
      const targetPathTemplate = templates[targetPathTemplateIndex];
      if (targetPathTemplate !== undefined) {
        templates.splice(targetPathTemplateIndex, 1);
        templates.unshift(targetPathTemplate);
      }
    }

    if (useFallback && this._fallback) {
      templates.push(this._fallback);
    }

    let outputs: TemplateOutput[];
    if (tryAllTemplates) {
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
        } else if (!onlyApplicable) {
          outputs.push(output);
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
