import { TranslationStep, StepOutput } from "./step";
import { TargetUrl } from "../targetUrl";
import { SimpleCitoidField, isSimpleCitoidField } from "../citoid";

export abstract class Selection extends TranslationStep {
  abstract readonly type: SelectionType;

  protected abstract _config: string;
  abstract get config(): string;
  abstract set config(config: unknown);

  apply = this.select;
  abstract suggest(query: string): Promise<string>;
  abstract select(target: TargetUrl): Promise<StepOutput>;
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
  constructor(field?: SimpleCitoidField) {
    super();
    this.type = "citoid";
    if (field) this.config = field;
  }

  get config(): SimpleCitoidField | "" {
    return this._config;
  }

  set config(config: unknown) {
    if (isSimpleCitoidField(config)) {
      this._config = config;
    } else {
      // todo: consider creating specific error type
      throw new TypeError(
        `Configuration value "${config}" is not a valid Citoid field`
      );
    }
  }

  select(target: TargetUrl): Promise<StepOutput> {
    if (this.config === "") {
      // todo: this error will be used in other Selection objects
      throw Error("Set selection config value before attempting selection");
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

  suggest(query: string): Promise<string> {
    // todo: pending implementation
    return new Promise((resolve, reject) => {
      resolve("");
    });
  }
}
