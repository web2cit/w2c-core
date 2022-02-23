import * as config from "../config";
import { MediaWikiBaseFieldCitation } from "../citoid";
import { FieldName } from "../translationField";
import { Webpage } from "../webpage/webpage";
import { outputToCitation } from "../templates/templateField";
import { TemplateConfiguration } from "./templateConfiguration";
import { PatternConfiguration } from "./patternConfiguration";
import {
  PatternDefinition,
  FallbackTemplateDefinition,
  TemplateDefinition,
  TemplateOutput,
  StepOutput,
  TransformationDefinition,
  TemplateFieldOutput,
  SelectionDefinition,
} from "../types";
import { isDomainName } from "../utils";
import { DomainNameError } from "../errors";

export class Domain {
  readonly domain: string;
  templates: TemplateConfiguration;
  patterns: PatternConfiguration;
  // tests: TestConfiguration;
  constructor(
    domain: string,
    definition: {
      templates?: Array<TemplateDefinition>;
      patterns?: Array<PatternDefinition>;
      // tests?: Array<Object>,
    } = {},
    fallbackTemplate?: FallbackTemplateDefinition,
    catchallPattern = true
  ) {
    if (isDomainName(domain)) {
      this.domain = domain;
    } else {
      throw new DomainNameError(domain);
    }
    this.templates = new TemplateConfiguration(
      domain,
      config.forceRequiredFields,
      fallbackTemplate,
      definition.templates
    );
    this.patterns = new PatternConfiguration(
      domain,
      definition.patterns,
      catchallPattern
    );
  }

  async translate(
    target: Webpage,
    options: {
      templateFieldInfo?: boolean; // returns the fieldoutput array or not, rename array?
      allTemplates?: boolean; // pass this to template set: don't do sequential, don't stop when first applicable found
      onlyApplicable?: boolean; // only return results for applicable templates; if allTemplates false, only tried templates will be returned
      fillWithCitoid?: boolean; // replace all invalid fields with citoid response
      forceTemplatePaths?: string[];
      forcePattern?: string; // make as if target matched this pattern; ignored if forceTemplates
    } = {
      templateFieldInfo: false,
      allTemplates: false,
      onlyApplicable: true,
      fillWithCitoid: false,
    }
  ): Promise<TranslationOutput> {
    let pattern: string | undefined; // remains undefined if forceTemplatePaths
    let templatePaths: string[];

    if (options.forceTemplatePaths === undefined) {
      // determine what pattern the target belongs to
      pattern =
        options.forcePattern ??
        this.patterns.sortPaths(target.path).keys().next().value;
      if (pattern !== undefined) {
        // get all template paths for that pattern
        templatePaths = this.patterns.sortPaths(this.templates.paths, pattern);
      } else {
        templatePaths = [];
      }
    } else {
      templatePaths = options.forceTemplatePaths;
    }

    // translate target with templates for paths returned above
    let templateOutputs = await this.templates.translateWith(
      target,
      templatePaths,
      {
        tryAllTemplates: options.allTemplates,
        useFallback: options.forceTemplatePaths === undefined,
      }
    );

    // parse output with onlyApplicable option
    if (options.onlyApplicable) {
      templateOutputs = templateOutputs.filter(
        (templateOutput) => templateOutput.applicable
      );
    }

    let baseCitation: MediaWikiBaseFieldCitation | undefined;
    if (options.fillWithCitoid) {
      // baseCitation = (await target.cache.citoid.getData()).citation
    }

    // compose the final outputs
    const outputs: Translation[] = templateOutputs.map((templateOutput) => {
      return this.composeOutput(
        templateOutput,
        options.templateFieldInfo,
        baseCitation
      );
    });

    return {
      domain: {
        name: this.domain,
        definitions: {
          patterns: {
            revid: this.patterns.currentRevid,
          },
          templates: {
            revid: this.templates.currentRevid,
          },
        },
      },
      target: {
        path: target.path,
        caches: {
          http:
            target.cache.http.timestamp !== undefined
              ? { timestamp: target.cache.http.timestamp }
              : undefined,
          citoid:
            target.cache.citoid.timestamp !== undefined
              ? { timestamp: target.cache.citoid.timestamp }
              : undefined,
        },
      },
      translation: {
        pattern: pattern,
        outputs: outputs,
      },
    };
  }

  /**
   * Compose a final translation from a template output
   * @param templateOutput
   * @param templateFieldInfo
   * @param baseCitation
   * @returns
   */
  private composeOutput(
    templateOutput: TemplateOutput,
    templateFieldInfo = false,
    baseCitation?: MediaWikiBaseFieldCitation
  ): Translation {
    // create citoid citations from output
    const citation = this.makeCitation(
      templateOutput.outputs,
      templateOutput.target.url.href,
      baseCitation
    );

    let fields: FieldInfo[] | undefined;
    if (templateFieldInfo) {
      fields = templateOutput.outputs.map((fieldOutput) => {
        // fixme: this should be simplified when SelectionOutput is changed
        const procedures = fieldOutput.procedureOutputs.map(
          (procedureOutput) => {
            const selections = procedureOutput.procedure.selections.map(
              (selection, index) => {
                return {
                  type: selection.type,
                  config: selection.config,
                  output: procedureOutput.output.selection[index] as StepOutput,
                };
              }
            );
            const transformations =
              procedureOutput.procedure.transformations.map(
                (transformation, index) => {
                  return {
                    type: transformation.type,
                    config: transformation.config,
                    itemwise: transformation.itemwise,
                    output: procedureOutput.output.transformation[
                      index
                    ] as StepOutput,
                  };
                }
              );
            return {
              selections,
              transformations,
              output: procedureOutput.output.procedure,
            };
          }
        );
        const fieldInfo: FieldInfo = {
          name: fieldOutput.fieldname,
          required: fieldOutput.required,
          procedures,
          output: fieldOutput.output,
          applicable: fieldOutput.applicable,
        };
        return fieldInfo;
      });
    }

    const translation: Translation = {
      citation: citation,
      timestamp: templateOutput.timestamp,
      template: {
        path: templateOutput.template.path,
        applicable: templateOutput.applicable,
        fields,
      },
    };
    return translation;
  }

  private makeCitation(
    fieldOutputs: TemplateFieldOutput[],
    url: string,
    baseCitation?: MediaWikiBaseFieldCitation
  ): WebToCitCitation {
    const tmpCitation = outputToCitation(fieldOutputs);

    const itemType = tmpCitation.itemType ?? baseCitation?.itemType;
    if (itemType === undefined) {
      throw new Error(
        `"itemType" not found in template output or base citation`
      );
    }
    const title = tmpCitation.title ?? baseCitation?.title;
    if (title === undefined) {
      throw new Error(`"title" not found in template output or base citation`);
    }

    const citation: WebToCitCitation = {
      ...baseCitation,
      ...tmpCitation,

      // required fields...
      // ...for which we may have a template output (see above)
      itemType,
      title,
      // ...for which we may have template fields in the future
      tags: baseCitation?.tags ?? [],
      url,
      // ...for which we always override the baseCitation value
      key: "",
      version: 0,

      // optional fields...
      // ...for which we never want the baseCitation value
      source: baseCitation ? ["Web2Cit", "Zotero"] : ["Web2Cit"],
    };
    return citation;
  }
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
        timestamp: string;
      };
      citoid?: {
        timestamp: string;
      };
    };
  };
  translation: {
    outputs: Translation[];
    pattern?: string; // undefined if forced templates
  };
};

type Translation = {
  // todo: move out; it's a template output with extra "citation"
  template: {
    applicable?: boolean; // for some specific types it should always be true; // may be undefined if wasn't tired (allTemplates = false && onlyApplicable = false)
    path: string | undefined; // undefined for fallback template
    fields?: FieldInfo[];
  };
  citation: WebToCitCitation;
  timestamp: string;
};

type FieldInfo = {
  // may be undefined if wasn't tired (allTemplates = false && onlyApplicable = false)
  // todo: move out; a merge between field definition and field output
  // field definition
  name: FieldName;
  required: boolean;
  // field output
  procedures: {
    selections: Array<SelectionDefinition & { output: StepOutput }>;
    transformations: Array<TransformationDefinition & { output: StepOutput }>;
    output: StepOutput;
  }[];
  output: Array<string | null>; // this is a validated output; no need to have separate valid property
  applicable: boolean;
};

type WebToCitCitation = Omit<MediaWikiBaseFieldCitation, "source"> & {
  source: Array<"Web2Cit" | "Zotero">;
};
