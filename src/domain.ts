import {
  TranslationTemplate,
  TemplateDefinition,
  FallbackTemplateDefinition,
  FallbackTemplate,
  BaseTranslationTemplate,
  translateWithTemplates,
} from "./templates/template";
import { PathPattern, PatternDefinition } from "./pattern";
import log from "loglevel";
import * as config from "./config";
import { MediaWikiBaseFieldCitation } from "./citoid";
import { SelectionDefinition } from "./templates/selection";
import { StepOutput } from "./templates/step";
import { TransformationDefinition } from "./templates/transformation";
import { FieldName } from "./translationField";
import { Webpage } from ".";

class Domain {
  readonly domain: string;
  readonly catchallPattern: Readonly<PathPattern> | undefined;
  private _templates: Array<TranslationTemplate> = [];
  private _patterns: Array<PathPattern> = [];
  // private _tests: Array<Object> = [];
  private _fallbackTemplate: FallbackTemplate | undefined;
  private revIDs: {
    templates: number | undefined;
    patterns: number | undefined;
    tests: number | undefined;
  };
  constructor(
    domain: string,
    definition: {
      templates?: Array<TemplateDefinition>;
      patterns?: Array<PatternDefinition>;
      // tests?: Array<Object>,
    } = {},
    fallbackTemplate: FallbackTemplateDefinition | undefined,
    catchallPattern = true
  ) {
    if (isDomainName(domain)) {
      this.domain = domain;
    } else {
      throw new DomainNameError(domain);
    }
    if (fallbackTemplate) this.fallbackTemplate = fallbackTemplate;
    if (catchallPattern) this.catchallPattern = PathPattern.catchall;
    if (definition && definition.templates) {
      definition.templates.forEach((templateDef) => {
        try {
          this.addTemplate(templateDef);
        } catch (e) {
          if (e instanceof DuplicateTemplatePathError) {
            // silently ignore duplicate template paths
            log.info(
              `Skipping duplicate templates for path ${templateDef.path}`
            );
          } else {
            throw e;
          }
        }
      });
    }
    if (definition && definition.patterns) {
      definition.patterns.forEach((patternDef) => this.addPattern(patternDef));
    }
  }

  get templates() {
    return Object.freeze([...this._templates]);
  }

  set templates(templates) {
    throw new Error(
      `Cannot set templates. Use add/move/removeTemplate methods instead`
    );
  }

  get patterns() {
    const patterns = [...this._patterns];
    return Object.freeze(patterns);
  }

  set patterns(patterns) {
    throw new Error(
      `Cannot set patterns. Use add/move/removePattern methods instead`
    );
  }

  get fallbackTemplate() {
    if (this._fallbackTemplate !== undefined) {
      return this._fallbackTemplate.toJSON();
    }
  }

  set fallbackTemplate(definition: FallbackTemplateDefinition | undefined) {
    if (definition === undefined) {
      this._fallbackTemplate = undefined;
    } else {
      if ("path" in definition) {
        throw new Error("Fallback template should not have template path");
      }
      this._fallbackTemplate = new FallbackTemplate(
        this.domain,
        definition,
        config.forceRequiredFields
      );
    }
  }

  // fixme:
  // running any of these should change the corresponding revid?
  // beware: also mutating one of the templates, patterns, etc!!

  addTemplate(
    definition: TemplateDefinition,
    index?: number
  ): TranslationTemplate {
    // create template instance before checking if path already exists
    // because the template constructor may make changes to the path
    const newTemplate = new TranslationTemplate(
      this.domain,
      definition,
      config.forceRequiredFields
    );
    if (
      this._templates.some((template) => template.path === newTemplate.path)
    ) {
      throw new DuplicateTemplatePathError(definition.path);
    } else {
      if (index !== undefined) {
        this._templates.splice(index, 0, newTemplate);
      } else {
        this._templates.push(newTemplate);
      }
    }
    return newTemplate;
  }

  getTemplate(path: string): TranslationTemplate | undefined {
    const index = this._templates.findIndex(
      (template) => template.path === path
    );
    const template = this._templates[index];
    return template;
  }

  moveTemplate(path: string, newIndex: number): void {
    const oldIndex = this._templates.findIndex(
      (template) => template.path === path
    );
    const template = this._templates.splice(oldIndex, 1)[0];
    if (template !== undefined) {
      this._templates.splice(newIndex, 0, template);
    }
  }

  removeTemplate(path: string): void {
    const index = this._templates.findIndex(
      (template) => template.path === path
    );
    if (index > -1) {
      this._templates.splice(index, 1);
      log.info(
        `Template for path ${path} at index ${index} successfully removed`
      );
    } else {
      log.info(`Could not remove template for path ${path}. No template found`);
    }
  }

  addPattern(definition: PatternDefinition, index?: number): PathPattern {
    const newPattern = new PathPattern(definition.pattern, definition.label);
    if (
      this._patterns.some((pattern) => pattern.pattern === newPattern.pattern)
    ) {
      // silently ignore patterns already in the list
      log.info(`Pattern ${definition.pattern} already in the pattern list`);
    } else if (
      this.catchallPattern &&
      this.catchallPattern.pattern === newPattern.pattern
    ) {
      // silently ignore pattern matching the catchall pattern
      log.info(`Pattern ${definition.pattern} matches the catchall pattern`);
    } else {
      if (index !== undefined) {
        this._patterns.splice(index, 0, newPattern);
      } else {
        this._patterns.push(newPattern);
      }
    }
    return newPattern;
  }

  getPattern(pattern: string): PathPattern | undefined {
    const index = this._patterns.findIndex(
      (patternObj) => patternObj.pattern === pattern
    );
    return this._patterns[index];
  }

  movePattern(pattern: string, newIndex: number): void {
    const oldIndex = this._patterns.findIndex((patternObj) => {
      patternObj.pattern === pattern;
    });
    const patternObj = this._patterns[oldIndex];
    if (patternObj !== undefined) {
      this._patterns.splice(newIndex, 0, patternObj);
    }
  }

  removePattern(pattern: string): void {
    const index = this._patterns.findIndex((patternObj) => {
      patternObj.pattern === pattern;
    });
    if (index > -1) this._patterns.splice(index, 1);
  }

  sortPaths(paths: PathString[] | PathString): Map<PatternString, PathString[]>;
  sortPaths(
    paths: PathString[] | PathString,
    targetPattern: PatternString
  ): PathString[];
  sortPaths(
    paths: PathString[] | PathString,
    targetPattern?: PatternString
  ): Map<PatternString, PathString[]> | PathString[] {
    const output: Map<PatternString, Array<PathString>> = new Map();
    if (
      targetPattern !== undefined &&
      // fixme: inject catchall pattern
      this._patterns.every((pattern) => pattern.pattern !== targetPattern)
    ) {
      // immediately return an empty array if the target pattern is not in the pattern list
      return [];
      // throw new Error(`Pattern "${targetPattern}" not in the pattern list`);
    }
    if (!Array.isArray(paths)) {
      paths = [paths];
    }
    let pendingPaths = [...paths];
    for (const pattern of this._patterns) {
      const matches: PathString[] = [];
      const newPending: PathString[] = [];
      for (const path of pendingPaths) {
        if (pattern.match(path)) {
          matches.push(path);
        } else {
          newPending.push(path);
        }
      }
      if (matches.length) output.set(pattern.pattern, matches);
      pendingPaths = newPending;
      if (pattern.pattern === targetPattern) break;
    }
    if (targetPattern) {
      return output.get(targetPattern) ?? [];
    } else {
      return output;
    }
  }

  // fixme: add an option to not add fallback at the end
  getTemplatesForPattern(pattern: string): Array<BaseTranslationTemplate> {
    const paths = this.sortPaths(
      this.templates.map((template) => template.path),
      pattern
    );
    const templates: BaseTranslationTemplate[] = paths.map(
      // path came from sortPaths(), so getTemplate(path) should be defined
      (path) => this.getTemplate(path) as TranslationTemplate
    );
    if (this._fallbackTemplate) templates.push(this._fallbackTemplate);
    return templates;
  }

  async translate(
    target: Webpage,
    options: {
      templateFieldInfo: boolean; // returns the fieldoutput array or not, rename array?
      allTemplates: boolean; // pass this to template set: don't do sequential, don't stop when first applicable found
      onlyApplicable: boolean; // only return results for applicable templates; if allTemplates false, only tried templates will be returned
      fillWithCitoid: boolean; // replace all invalid fields with citoid response
      forceTemplatePaths?: string[];
      forcePattern?: string; // make as if target matched this pattern; ignored if forceTemplates
    } = {
      templateFieldInfo: false, // returns the fieldoutput array or not, rename array?
      allTemplates: false, // pass this to template set: don't do sequential, don't stop when first applicable found
      onlyApplicable: true, // only return results for applicable templates; if allTemplates false, only tried templates will be returned
      fillWithCitoid: false,
    }
  ): Promise<TranslationOutput> {
    let pattern: string | undefined; // remains undefined if forceTemplatePaths
    // determine what pattern the target belongs to
    // use forcePattern option, skip step if forceTemplatePaths
    // handle an empty response (stop here)

    // get all templates for that pattern
    // use forceTemplatePaths
    // get the actual templates plus fallback (even with forceTemplates?)

    // translate target with templates returned above
    // use allTemplates option
    let templateOutputs = await translateWithTemplates(target, [], {
      tryAllTemplates: options.allTemplates,
    });

    // parse output with onlyApplicable option
    if (options.onlyApplicable) {
      templateOutputs = templateOutputs.filter(
        (templateOutput) => templateOutput.applicable
      );
    }

    // create citoid citations from output
    // use fillWithCitiod
    // template output to citoid function
    // should we have this in the template file?
    // in the citoid file?

    // compose the final outputs
    const outputs = [];

    return {
      domain: {
        name: this.domain,
        definitions: {
          patterns: {
            revid: this.revIDs.patterns,
          },
          templates: {
            revid: this.revIDs.templates,
          },
        },
      },
      target: {
        path: target.path,
        caches: {
          http: {
            // fixme: do not call getdata if not needed!
            timestamp: (await target.cache.http.getData()).timestamp,
          },
          citoid: {
            // fixme: idem
            timestamp: (await target.cache.http.getData()).timestamp,
          },
        },
      },
      translation: {
        pattern: pattern,
        outputs: outputs,
      },
    };
  }

  async fetchTemplates(): Promise<void> {
    // update templatesRevID
    return;
  }
  async fetchPatterns(): Promise<void> {
    // update patternsRevID
    return;
  }
  async fetchTests(): Promise<void> {
    // update testsRevID
    return;
  }

  toJSON(): {
    templates: TemplateDefinition[];
    patterns: PatternDefinition[];
    tests: [];
  } {
    return {
      templates: [],
      patterns: [], // do not include the fallback pattern
      tests: [],
    };
  }
}

type PathString = string;
type PatternString = string;

export { Domain };

/**
 * Return whether the host name provided is a valid fully qualified domain name
 * https://en.wikipedia.org/wiki/Fully_qualified_domain_name
 */
export function isDomainName(hostname: string): boolean {
  // remove trailing dot
  hostname = hostname.replace(/\.$/, "");

  // max 255 octets https://devblogs.microsoft.com/oldnewthing/20120412-00/?p=7873
  if (hostname.length > 253) return false;

  const labels = hostname.split(".");

  // at least two labels: label + tld
  if (labels.length < 2) return false;

  // letters, numbers or hyphen, do not start or end with hyphen
  const labelPattern = /^([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9-]*[A-Za-z0-9])$/;
  for (const label of labels) {
    if (!labelPattern.test(label)) return false;
    if (label.length > 63) return false;
  }

  return true;
}

// todo: consider extending into the more-specific output types
export type TranslationOutput = {
  domain: {
    name: string;
    definitions: {
      patterns: {
        revid?: number; // can they be 0?
      };
      templates: {
        revid?: number;
      };
    };
  };
  // webpage tojson?
  target: {
    path: string;
    caches: {
      http?: {
        timestamp: number;
      };
      citoid?: {
        timestamp: number;
      };
    };
  };
  translation: {
    outputs: {
      // todo: move out; it's a template output with extra "citation"
      template: {
        applicable?: boolean; // for some specific types it should always be true; // may be undefined if wasn't tired (allTemplates = false && onlyApplicable = false)
        path: string | null; // undefined for fallback template
        fields?: {
          // may be undefined if wasn't tired (allTemplates = false && onlyApplicable = false)
          // todo: move out; a merge between field definition and field output
          // field definition
          name: FieldName;
          required: boolean;
          // field output
          procedure: {
            selections: Array<SelectionDefinition & { output: StepOutput }>;
            transformations: Array<
              TransformationDefinition & { output: StepOutput }
            >;
            output: StepOutput;
          };
          output: Array<string | null>; // this is a validated output; no need to have separate valid property
          applicable: boolean;
        }[];
      };
      citation: MediaWikiBaseFieldCitation;
      timestamp: number;
    }[];
    pattern?: string; // undefined if forced templates
  };
};

export class DomainNameError extends Error {
  constructor(domain: string) {
    super(`"${domain}" is not a valid domain name`);
  }
}

export class DuplicateTemplatePathError extends Error {
  constructor(path: string) {
    super(`There is a template for path ${path} already`);
    this.name = "Duplicate template path error";
  }
}
