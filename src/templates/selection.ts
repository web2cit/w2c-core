import { TranslationStep } from "./step";
import { Webpage } from "../webpage/webpage";
import { SimpleCitoidField, isSimpleCitoidField } from "../citation/keyTypes";
import { StepOutput, SelectionDefinition } from "../types";
import jmespath from "jmespath";
import log from "loglevel";

export abstract class Selection extends TranslationStep {
  abstract readonly type: SelectionType;

  protected abstract _config: string;
  abstract get config(): string;
  abstract set config(config: string);

  apply: typeof this.select = async (target) => {
    try {
      const output = await this.select(target);
      return output;
    } catch (e) {
      if (e instanceof UndefinedSelectionConfigError) {
        // do not catch step application error due to config unset
        throw e;
      } else {
        log.warn(`Selection step of type "${this.type}" failed with: ${e}`);
        // return empty step output in case of step application error (T305163)
        return [];
      }
    }
  };
  protected abstract select(target: Webpage): Promise<StepOutput>;
  abstract suggest(target: Webpage, query: string): Promise<string>;

  static create(selection: SelectionDefinition) {
    const config = selection.config;
    switch (selection.type) {
      case "citoid":
        // assume config is SimpleCitoidField and let constructor fail otherwise
        return new CitoidSelection(config as SimpleCitoidField);
        break;
      case "xpath":
        return new XPathSelection(config);
        break;
      case "fixed":
        return new FixedSelection(config);
        break;
      case "json-ld":
        return new JsonLdSelection(config);
        break;
      default:
        throw new Error(`Unknown selection of type ${selection.type}`);
    }
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
  readonly type: SelectionType = "citoid";
  protected _config: SimpleCitoidField | "" = "";
  constructor(field?: CitoidSelection["_config"]) {
    super();
    if (field !== undefined) this.config = field;
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

  protected select(target: Webpage): Promise<StepOutput> {
    if (this.config === "") {
      throw new UndefinedSelectionConfigError();
    }
    const field = this.config;
    return new Promise((resolve, reject) => {
      target.cache.citoid
        .getData(false)
        .then((data) => {
          let selection = data.citation.simple[field];
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

  suggest(target: Webpage, query: string): Promise<string> {
    // todo: pending implementation
    return new Promise((resolve, reject) => {
      resolve("");
    });
  }
}

export class XPathSelection extends Selection {
  readonly type: SelectionType = "xpath";
  protected _config = "";
  // private _parsedXPath: XPathExpression | undefined;
  constructor(expression?: XPathSelection["_config"]) {
    super();
    if (expression !== undefined) this.config = expression;
  }

  get config(): XPathSelection["_config"] {
    return this._config;
  }

  set config(expression: string) {
    try {
      // do not save pre-parsed xpath as it won't be good to evaluate against
      // another document in Firefox (see T316370)
      // this._parsedXPath = windowContext.document.createExpression(expression);
      const parsedXPath = windowContext.document.createExpression(expression);
      // to workaround #T308666, try parsed expression on the document with
      // which it was created before confirming config validity
      // todo: reassess if https://github.com/jsdom/jsdom/issues/3371 is fixed
      parsedXPath.evaluate(
        windowContext.document,
        // @types/jsdom says that the type parameter is optional,
        // but jsdom seems to be failing without it
        // see https://github.com/jsdom/jsdom/issues/3422
        windowContext.XPathResult.ANY_TYPE
      );
      this._config = expression;
    } catch {
      throw new SelectionConfigTypeError(this.type, expression);
    }
  }

  protected select(target: Webpage): Promise<StepOutput> {
    if (this._config === "") {
      throw new UndefinedSelectionConfigError();
    }
    // const parsedXPath = this._parsedXPath;
    const expression = this._config;
    return new Promise((resolve, reject) => {
      target.cache.http
        .getData(false)
        .then((data) => {
          const selection: StepOutput = [];
          // parse xpath on the fly (instead of using pre-parsed xpath) to
          // ensure compatibilty with Firefox (see T316370)
          const parsedXPath = data.doc.createExpression(expression);
          try {
            const result = parsedXPath.evaluate(
              data.doc,
              windowContext.XPathResult.ORDERED_NODE_ITERATOR_TYPE
            );
            let thisNode = result.iterateNext();
            while (thisNode) {
              if (
                thisNode instanceof windowContext.HTMLElement &&
                thisNode.innerText !== undefined
              ) {
                // JSDOM does not support innerText anyways
                // https://github.com/jsdom/jsdom/issues/1245
                selection.push(thisNode.innerText);
              } else if (thisNode instanceof windowContext.Attr) {
                selection.push(thisNode.value);
              } else {
                const textContent = (thisNode.textContent ?? "")
                  // workaround JSDOM does not support innerText
                  .replace(/[\t\n\r ]+/g, " ")
                  .trim();
                // ignore empty-text nodes
                if (textContent) selection.push(textContent);
              }
              thisNode = result.iterateNext();
            }
          } catch {
            const result = parsedXPath.evaluate(
              data.doc,
              windowContext.XPathResult.ANY_TYPE
            );
            switch (result.resultType) {
              case windowContext.XPathResult.NUMBER_TYPE:
                selection.push(result.numberValue.toString());
                break;
              case windowContext.XPathResult.STRING_TYPE:
                selection.push(result.stringValue);
                break;
              case windowContext.XPathResult.BOOLEAN_TYPE:
                selection.push(result.booleanValue.toString().trim());
                break;
            }
          }
          resolve(selection);
        })
        .catch((reason) => {
          reject(reason);
        });
    });
  }

  suggest(target: Webpage, query: string): Promise<XPathSelection["_config"]> {
    return Promise.resolve("");
  }
}

export class JsonLdSelection extends Selection {
  readonly type: SelectionType = "json-ld";
  protected _config = "";
  constructor(path?: JsonLdSelection["_config"]) {
    super();
    if (path !== undefined) this.config = path;
  }

  get config(): JsonLdSelection["_config"] {
    return this._config;
  }

  set config(path: JsonLdSelection["_config"]) {
    try {
      jmespath.search({}, path);
      this._config = path;
    } catch {
      throw new SelectionConfigTypeError(this.type, path);
    }
  }

  protected select(target: Webpage): Promise<StepOutput> {
    if (this._config === "") {
      throw new UndefinedSelectionConfigError();
    }
    return new Promise((resolve, reject) => {
      target.cache.http
        .getData(false)
        .then((data) => {
          // create an array of json-ld objects
          let jsonld: ReturnType<JSON["parse"]>[] = [];
          Array.from(
            data.doc.querySelectorAll('script[type="application/ld+json"')
          ).forEach((script, index) => {
            let content = script.textContent;
            if (content !== null) {
              // drop unescaped control characters (T318336)
              // eslint-disable-next-line no-control-regex
              content = content.replace(/[\x00-\x1F\x7F\x80-\x9F]/g, " ");
              try {
                const json = JSON.parse(content);
                // do not push in case it is an array, concat instead
                jsonld = jsonld.concat(json);
              } catch {
                log.warn(`Could not parse JSON-LD object #${index + 1}`);
              }
            }
          });

          const result = jmespath.search(jsonld, this.config);

          // normalize result
          const selection: StepOutput = [];
          ([] as any[]).concat(result).forEach((value) => {
            // ignore null values
            if (value === null) return;
            // stringify non-string values
            if (typeof value !== "string") value = JSON.stringify(value);
            selection.push(value);
          });

          resolve(selection);
        })
        .catch((reason) => {
          reject(reason);
        });
    });
  }

  suggest(target: Webpage, query: string): Promise<JsonLdSelection["_config"]> {
    return Promise.resolve("");
  }
}

export class FixedSelection extends Selection {
  readonly type: SelectionType = "fixed";
  protected _config = "";
  constructor(value?: string) {
    super();
    if (value !== undefined) this.config = value;
  }

  get config(): string {
    return this._config;
  }

  set config(config: string) {
    if (typeof config === "string") {
      this._config = config;
    } else {
      throw new SelectionConfigTypeError(this.type, config);
    }
  }

  protected select(target: Webpage): Promise<StepOutput> {
    return Promise.resolve([this.config]);
  }

  suggest(target: Webpage, query: string): Promise<string> {
    return Promise.resolve(query);
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
