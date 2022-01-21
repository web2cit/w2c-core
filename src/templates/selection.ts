import { TargetUrl } from "../targetUrl";
import { CustomCitoidField, isCustomCitoidField } from "../citoid";

// type SelectionFunction = (target: TargetUrl, config: string) => Array<string>;
// type SuggestFunction = (target: TargetUrl, query: string) => string;

// const citoidSelection: SelectionFunction = function() => {
//     return
// }

abstract class Selection {
  type: SelectionType | undefined;
  target: TargetUrl;

  protected _config: CustomCitoidField | undefined;
  abstract get config(): CustomCitoidField | undefined;
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
  constructor(target: TargetUrl, field?: CustomCitoidField) {
    super(target);
    this.type = "citoid";
    if (field) this.config = field;
  }

  get config(): CustomCitoidField | undefined {
    return this._config;
  }

  set config(config: unknown) {
    if (isCustomCitoidField(config)) {
      this._config = config;
    } else {
      // todo: consider creating specific error type
      throw Error(`Configuration value ${config} is not a valid Citoid field`);
    }
  }

  select(): Promise<Array<string>> {
    if (this.config === undefined) {
      // todo: this error will be used in other Selection objects
      throw Error("Set selection config value before attempting selection");
    }
    const field = this.config;
    return new Promise((resolve, reject) => {
      if (this.target.cache.citoid.refreshPromise === undefined) {
        this.target.cache.citoid.refresh();
      }
      // if citoid cache is refreshing, wait until done refreshing
      // todo: clearly assert refreshPromise can't be undefined here
      return this.target.cache.citoid
        .refreshPromise!.then((data) => {
          {
            let selection = data.citation[field];
            if (!(selection instanceof Array)) {
              if (selection === undefined) {
                selection = "";
              }
              selection = [selection];
            }
            // todo: citation should be CustomCitoidCitation (only string or string array values)
            resolve(selection);
          }
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
