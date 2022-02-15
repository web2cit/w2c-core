import {
  TranslationTemplate,
  TemplateDefinition,
  FallbackTemplateDefinition,
} from "./templates/template";
import { PathPattern, PatternDefinition } from "./pattern";
import log from "loglevel";
import * as config from "./config";
import { Webpage } from ".";

class Domain {
  domain: string;
  private _templates: Array<TranslationTemplate> = [];
  private _patterns: Array<PathPattern> = [];
  // private _tests: Array<Object> = [];
  private _fallbackTemplate: TranslationTemplate | undefined;
  private _fallbackPattern = new PathPattern(config.FALLBACK_PATTERN);
  constructor(
    domain: string,
    definition?: {
      templates?: Array<TemplateDefinition>;
      patterns?: Array<PatternDefinition>;
      // tests?: Array<Object>,
    },
    fallbacks?: {
      template: FallbackTemplateDefinition;
      pattern: PatternDefinition;
    }
  ) {
    if (isDomainName(domain)) {
      this.domain = domain;
    } else {
      throw new DomainNameError(domain);
    }
    if (fallbacks) {
      if (fallbacks.template) this.fallbackTemplate = fallbacks.template;
      if (fallbacks.pattern) this.fallbackPattern = fallbacks.pattern;
    }
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

  get patterns() {
    const patterns = [...this._patterns];
    // include the fallback pattern in the returned value
    if (this._fallbacks.pattern) patterns.push(this._fallbacks.pattern);
    return Object.freeze(patterns);
  }

  set fallbackTemplate(definition: FallbackTemplateDefinition) {
    if ("path" in definition) {
      throw new Error();
    } else {
      this._fallbacks.template = new TranslationTemplate(
        this.domain,
        definition
      );
    }
  }

  set fallbackPattern(definition: PathPattern) {
    // confirm it doesn't exist already in the pattern list
  }

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
    if (index > -1) this._templates.splice(index, 1);
  }

  addPattern(definition: PatternDefinition, index?: number): PathPattern {
    const newPattern = new PathPattern(definition.pattern, definition.label);
    // silently ignore patterns already in the list
    if (
      // fixme: include fallback pattern in the check
      this._patterns.some((pattern) => pattern.pattern === newPattern.pattern)
    ) {
      log.info(`Pattern ${definition.pattern} already in the pattern list`);
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

  // todo: get rid of the template set?
  // translate(
  //   target: Webpage,
  //   fieldoutputs: boolean; // returns the fieldoutput array or not, rename array?
  //   allTemplates = false  // pass this to template set: don't do sequential, don't stop when first applicable found
  //   onlyApplicable = true  // only return results for applicable templates; if allTemplates false, only tried templates will be returned
  //   forceTemplates = [paths]
  //   forcePattern = pattern  // make as if target matched this pattern; ignored if forceTemplates
  // ): {

  //   target: {
  //     path: '',
  //     cachetime: {
  //       https: number,
  //       citoid: number
  //     }
  //   }
  //   domain: {
  //     name: '',
  //     templates_revid: ,
  //     patterns_revid:
  //   }
  //   translation: {
  //     pattern: pattern used (pattern), or "*", or undefined if ignored (forced templates)
  //     // maybe this should be how template set returns (except citation)
  //     output: [  // whether one or all is controlled by the allapplicable
  //       {
  //         templatepath: '',
  //         citation: citoid-compatible,  //
  //         applicable: true
  //         // BELOW ONLY IF REQUIRED
  //         fieldoutputs: [ // may be undefined if wasn't tired (allTemplates = false && onlyApplicable = false)
  //           {
  //             fieldname
  //             required
  //             valid
  //             applicable
  //             selection: [
  //               {
  //                 type: '',
  //                 value: '',
  //                 output: []
  //               },
  //             ],
  //             transformation: [{
  //               {
  //                 type: '',
  //                 value: '',
  //                 itemwise: '',
  //                 output: []
  //               }
  //             ]
  //             procedure: []
  //             output (validated procedure output): [] // redundant with valid
  //           }
  //         ]
  //         // update each module's output!!

  //         ]
  //       }
  //     ]
  //   }
  // }

  async fetchTemplates(): Promise<void> {
    return;
  }
  async fetchPatterns(): Promise<void> {
    return;
  }
  async fetchTests(): Promise<void> {
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
