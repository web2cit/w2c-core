import { TranslationStep, StepOutput } from "./step";
import { TargetUrl } from "../targetUrl";
import { SimpleCitoidField, isSimpleCitoidField } from "../citoid";

export abstract class Selection extends TranslationStep {
  abstract readonly type: SelectionType;

  protected abstract _config: string;
  abstract get config(): string;
  abstract set config(config: string);

  apply = this.select;
  abstract select(target: TargetUrl): Promise<StepOutput>;
  abstract suggest(target: TargetUrl, query: string): Promise<string>;
}

type SelectionType =
  // see "Selection step" in "Web2Cit specs"
  // https://docs.google.com/document/d/1OlT9VYje1dqQ-WLoEOziU-VphGuAAj_HihqT5RMe5d8/edit#
  | "citoid"
  | "url"
  | "json-ld"
  | "xpath"
  | "css"
  | "opengraph"
  | "quote" // in terms of the web anntation data model's text quotes
  | "header"
  | "fixed";

export class CitoidSelection extends Selection {
  readonly type: SelectionType = "citoid";
  protected _config: SimpleCitoidField | "" = "";
  constructor(field?: CitoidSelection["_config"]) {
    super();
    if (field) this.config = field;
  }

  get config(): CitoidSelection["_config"] {
    return this._config;
  }

  set config(config: string) {
    if (isSimpleCitoidField(config)) {
      this._config = config;
    } else {
      throw new SelectionConfigTypeError(this.type, config);
    }
  }

  select(target: TargetUrl): Promise<StepOutput> {
    if (this.config === "") {
      throw new UndefinedSelectionConfigError();
    }
    const field = this.config;
    return new Promise((resolve, reject) => {
      target.cache.citoid
        .getData(false)
        .then((data) => {
          let selection = data.citation[field];
          if (!(selection instanceof Array)) {
            if (selection === undefined) {
              selection = [];
            } else {
              selection = [selection];
            }
          }
          resolve(selection);
        })
        .catch((reason) => {
          reject(reason);
        });
    });
  }

  suggest(target: TargetUrl, query: string): Promise<string> {
    // todo: pending implementation
    return new Promise((resolve, reject) => {
      resolve("");
    });
  }
}

export class SelectionConfigTypeError extends TypeError {
  constructor(selectionType: SelectionType, config: string) {
    super(
      `"${config}" is not a valid configuration value for selection type "${selectionType}"`
    );
  }
}

export class UndefinedSelectionConfigError extends Error {
  constructor() {
    super("Set selection config value before attempting selection");
  }
}
