import { TargetUrl } from "../targetUrl";
import { SimpleCitoidField, isSimpleCitoidField } from "../citoid";

// type SelectionFunction = (target: TargetUrl, config: string) => Array<string>;
// type SuggestFunction = (target: TargetUrl, query: string) => string;

// const citoidSelection: SelectionFunction = function() => {
//     return
// }

abstract class Selection {
  type: SelectionType | undefined;
  target: TargetUrl;

  protected _config: string | undefined;
  abstract get config(): string | undefined;
  abstract set config(config: unknown);

  abstract select(): Promise<Array<string>>;
  abstract suggest(query: string): Promise<string>;

  constructor(target: TargetUrl) {
    this.target = target;
  }
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
  protected _config: SimpleCitoidField | undefined;
  constructor(target: TargetUrl, field?: SimpleCitoidField) {
    super(target);
    this.type = "citoid";
    if (field) this.config = field;
  }

  get config(): SimpleCitoidField | undefined {
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

  select(): Promise<Array<string>> {
    if (this.config === undefined) {
      // todo: this error will be used in other Selection objects
      throw Error("Set selection config value before attempting selection");
    }
    const field = this.config;
    return new Promise((resolve, reject) => {
      this.target.cache.citoid
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
