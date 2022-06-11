import * as config from "../config";
import {
  MediaWikiBaseFieldCitation,
  WebToCitCitation,
} from "../citation/citationTypes";
import { FieldName } from "../translationField";
import { Webpage, WebpageFactory } from "../webpage/webpage";
import { outputToCitation } from "../templates/templateField";
import { TemplateConfiguration } from "./templateConfiguration";
import { PatternConfiguration } from "./patternConfiguration";
import { TestConfiguration } from "./testConfiguration";
import {
  PatternDefinition,
  FallbackTemplateDefinition,
  TemplateDefinition,
  TemplateOutput,
  StepOutput,
  TransformationDefinition,
  TemplateFieldOutput,
  SelectionDefinition,
  TestDefinition,
  TestOutput,
} from "../types";
import { isDomainName } from "../utils";
import { DomainNameError } from "../errors";
import { fallbackTemplate as fallbackTemplateDefinition } from "../fallbackTemplate";
import log from "loglevel";

export class Domain {
  readonly domain: string;
  readonly webpages: WebpageFactory;
  templates: TemplateConfiguration;
  patterns: PatternConfiguration;
  tests: TestConfiguration;

  constructor(
    domain: string,
    options: DomainOptions = {
      fallbackTemplate: fallbackTemplateDefinition,
      catchallPattern: true,
      forceRequiredFields: config.forceRequiredFields,
    }
  ) {
    const {
      templates,
      patterns,
      tests,
      fallbackTemplate,
      catchallPattern,
      forceRequiredFields,
    } = options;
    if (isDomainName(domain)) {
      this.domain = domain;
    } else {
      throw new DomainNameError(domain);
    }

    // T302589: Create new Webpage objects via the Domain object
    // T302239: Create new Webpage objects through a method that maintains a cache
    this.webpages = new WebpageFactory(domain);
    this.templates = new TemplateConfiguration(
      domain,
      forceRequiredFields,
      fallbackTemplate,
      templates
    );
    this.patterns = new PatternConfiguration(domain, patterns, catchallPattern);
    this.tests = new TestConfiguration(domain, tests);
  }

  // instantiate domain object from URL
  // we may need this if we want to follow redirects before instantiating
  // the domain object (see T304773)
  static fromURL(url: string, options?: DomainOptions) {
    // this may fail
    const webpage = new Webpage(url);
    const domain = new Domain(webpage.domain, options);
    domain.webpages.setWebpage(webpage);
    return domain;
  }

  // T306555: Add a "fetchAndLoadConfig" method to the "Domain" objects
  // todo: pending test
  async fetchAndLoadConfigs(): Promise<void> {
    const outcomes = await Promise.allSettled([
      this.templates.fetchAndLoad(),
      this.patterns.fetchAndLoad(),
      this.tests.fetchAndLoad(),
    ]);
    for (const outcome of outcomes) {
      if (outcome.status === "rejected") {
        log.warn(outcome.reason);
      }
    }
  }

  // get all paths in template and test configurations
  getPaths(): string[] {
    const paths = Array.from(
      new Set([...this.templates.paths, ...this.tests.nonEmptyPaths])
    );
    return paths;
  }

  translate(
    paths: string | string[],
    options: TranslateOptions = {
      allTemplates: false,
      onlyApplicable: true,
      fillWithCitoid: false,
    }
  ): Promise<TargetOutput[]> {
    if (!Array.isArray(paths)) paths = [paths];

    let targetsByPattern: Map<string | undefined, string[]>;
    if (options.forceTemplatePaths !== undefined) {
      // if translation templates have been forced, pattern group makes no sense
      targetsByPattern = new Map([[undefined, paths]]);
    } else if (options.forcePattern !== undefined) {
      targetsByPattern = new Map([[options.forcePattern, paths]]);
    } else {
      // sort target paths into url path pattern groups
      targetsByPattern = this.patterns.sortPaths(paths);
    }

    const templatesByTarget: Map<
      string,
      { templatePaths: string[]; patternPath: string | undefined }
    > = new Map();

    for (const [patternPath, targetPaths] of Array.from(targetsByPattern)) {
      if (targetPaths.length === 0) continue;
      let templatePaths: string[];
      if (patternPath === undefined) {
        if (options.forceTemplatePaths === undefined) {
          throw new Error(
            "Unexpected undefined pattern path " +
              'with undefined "forceTemplatePaths" option'
          );
        }
        templatePaths = options.forceTemplatePaths;
      } else {
        // retrieve translation templates that belong to the same url path
        // pattern group
        templatePaths = this.patterns.sortPaths(
          this.templates.paths,
          patternPath
        );
      }

      for (const targetPath of targetPaths) {
        templatesByTarget.set(targetPath, {
          templatePaths,
          patternPath,
        });
      }
    }

    // iterate through target paths, in the order in which they were given,
    // and queue promises of target outputs into an array
    const targetOutputPromises: Promise<TargetOutput>[] = paths.map(
      (targetPath) => {
        const target = this.webpages.getWebpage(targetPath);
        const { templatePaths, patternPath } =
          templatesByTarget.get(targetPath)!;

        if (options.fillWithCitoid) {
          // prepare the Citoid cache
          // target.cache.citoid.getData();
        }

        const templateOutputsPromise = this.templates.translateWith(
          target,
          templatePaths,
          {
            tryAllTemplates: options.allTemplates,
            // do not use fallback template if translation templates have been
            // forced
            useFallback: options.forceTemplatePaths === undefined,
            onlyApplicable: options.onlyApplicable,
          }
        );

        const targetOutputPromise = templateOutputsPromise.then(
          (templateOutputs) => {
            let baseCitation: MediaWikiBaseFieldCitation | undefined;
            if (options.fillWithCitoid) {
              // baseCitation = (await target.cache.citoid.getData()).citation.simple
            }

            const translationResults = templateOutputs.map((templateOutput) => {
              const scores = this.tests.score(templateOutput);
              const enrichedOutput = makeTranslationResult(
                templateOutput,
                scores,
                baseCitation
              );
              return enrichedOutput;
            });

            const targetOutput: TargetOutput = {
              domain: {
                name: this.domain,
                definitions: {
                  patterns: {
                    revid: this.patterns.currentRevid,
                  },
                  templates: {
                    revid: this.templates.currentRevid,
                  },
                  tests: {
                    revid: this.tests.currentRevid,
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
                pattern: patternPath,
                outputs: translationResults,
              },
            };

            return targetOutput;
          }
        );

        return targetOutputPromise;
      }
    );

    return Promise.all(targetOutputPromises);
  }
}

/**
 * Compose a final translation from a template output
 * @param templateOutput
 * @param templateFieldInfo
 * @param baseCitation
 * @returns
 */
function makeTranslationResult(
  templateOutput: TemplateOutput,
  scores: TestOutput,
  baseCitation?: MediaWikiBaseFieldCitation
): TranslationResult {
  // create citoid citations from output
  let citation;
  if (templateOutput.applicable) {
    // only make citations for applicable template outputs
    citation = makeCitation(
      templateOutput.outputs,
      // With this we are setting the output citation's URL to that of the
      // target Webpage object, which does not follow redirects.
      // We may change this to the final response URL, but there may be cases
      // where we do not want to do that (see T210871).
      // Alternatively, we may let users manually change this using a URL
      // template field.
      templateOutput.target.url.href,
      baseCitation
    );
  }

  // templateFieldInfo
  const fields = templateOutput.outputs.map((fieldOutput) => {
    // fixme: this should be simplified when SelectionOutput is changed
    const procedures = fieldOutput.procedureOutputs.map((procedureOutput) => {
      const selections = procedureOutput.procedure.selections.map(
        (selection, index) => {
          return {
            type: selection.type,
            config: selection.config,
            output: procedureOutput.output.selection[index] as StepOutput,
          };
        }
      );
      const transformations = procedureOutput.procedure.transformations.map(
        (transformation, index) => {
          return {
            type: transformation.type,
            config: transformation.config,
            itemwise: transformation.itemwise,
            output: procedureOutput.output.transformation[index] as StepOutput,
          };
        }
      );
      return {
        selections,
        transformations,
        output: procedureOutput.output.procedure,
      };
    });
    const fieldInfo: FieldInfo = {
      name: fieldOutput.fieldname,
      required: fieldOutput.required,
      procedures,
      output: fieldOutput.output,
      valid: fieldOutput.valid,
      applicable: fieldOutput.applicable,
    };
    return fieldInfo;
  });

  const result: TranslationResult = {
    citation: citation,
    scores,
    timestamp: templateOutput.timestamp,
    template: {
      path: templateOutput.template.path,
      applicable: templateOutput.applicable,
      fields,
    },
  };
  return result;
}

function makeCitation(
  fieldOutputs: TemplateFieldOutput[],
  url: string,
  baseCitation?: MediaWikiBaseFieldCitation
): WebToCitCitation {
  const tmpCitation = outputToCitation(fieldOutputs);

  const itemType = tmpCitation.itemType ?? baseCitation?.itemType;
  if (itemType === undefined) {
    throw new Error(`"itemType" not found in template output or base citation`);
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
    url,

    // optional fields...
    // ...for which we never want the baseCitation value
    source: baseCitation ? ["Web2Cit", "Zotero"] : ["Web2Cit"],
    accessDate: new Date().toISOString().substring(0, 10),
  };
  return citation;
}

type DomainOptions = {
  templates?: Array<TemplateDefinition>;
  patterns?: Array<PatternDefinition>;
  tests?: Array<TestDefinition>;
  fallbackTemplate?: FallbackTemplateDefinition;
  catchallPattern?: boolean;
  forceRequiredFields?: FieldName[];
  // todo T306553: consider accepting alternative storage settings
};

type TranslateOptions = {
  allTemplates?: boolean; // pass this to template set: don't do sequential, don't stop when first applicable found
  onlyApplicable?: boolean; // only return results for applicable templates; if allTemplates false, only tried templates will be returned
  fillWithCitoid?: boolean; // replace all invalid fields with citoid response
  forceTemplatePaths?: string[];
  forcePattern?: string; // make as if target matched this pattern; ignored if forceTemplates
};

// todo: consider extending into the more-specific output types
export type TargetOutput = {
  domain: {
    name: string;
    definitions: {
      patterns: {
        revid?: number; // can they be 0?
      };
      templates: {
        revid?: number;
      };
      tests: {
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
    outputs: TranslationResult[];
    pattern?: string; // undefined if forced templates
  };
};

type TranslationResult = {
  template: {
    applicable?: boolean; // for some specific types it should always be true; // may be undefined if wasn't tired (allTemplates = false && onlyApplicable = false)
    path: string | undefined; // undefined for fallback template
    fields: FieldInfo[];
  };
  citation: WebToCitCitation | undefined;
  timestamp: string;
  scores: TestOutput;
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
  output: StepOutput;
  valid: boolean;
  applicable: boolean;
};
