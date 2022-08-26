import { TranslationStep } from "./step";
import { Webpage } from "../webpage/webpage";
import { SimpleCitoidField, isSimpleCitoidField } from "../citation/keyTypes";
import { StepOutput, SelectionDefinition } from "../types";

export abstract class Selection extends TranslationStep {
  abstract readonly type: SelectionType;

  protected abstract _config: string;
  abstract get config(): string;
  abstract set config(config: string);

  apply = this.select;
  abstract select(target: Webpage): Promise<StepOutput>;
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

  select(target: Webpage): Promise<StepOutput> {
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
    if (expression) this.config = expression;
  }

  get config(): XPathSelection["_config"] {
    return this._config;
  }

  set config(expression: string) {
    try {
      // do not save pre-parsed xpath as it won't be good to evaluate against
      // another document in Firefox (see T316370)
      // this._parsedXPath = windowContext.document.createExpression(expression);
      windowContext.document.createExpression(expression);
      this._config = expression;
    } catch {
      throw new SelectionConfigTypeError(this.type, expression);
    }
  }

  select(target: Webpage): Promise<StepOutput> {
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
              // thisNode can't be instance of this.window.HTMLElement, etc
              // because thisNode comes from a different window (data.doc's)
              if (isHTMLElement(thisNode)) {
                // JSDOM does not support innerText anyways
                // https://github.com/jsdom/jsdom/issues/1245
                selection.push(thisNode.innerText);
              } else if (isAttr(thisNode)) {
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

// HTMLElement and Attr may not be available
function isHTMLElement(node: Node): node is HTMLElement {
  return (node as HTMLElement).innerText !== undefined;
}
function isAttr(node: Node): node is Attr {
  return (node as Attr).value !== undefined;
}

export class FixedSelection extends Selection {
  readonly type: SelectionType = "fixed";
  protected _config = "";
  constructor(value?: string) {
    super();
    if (value) this.config = value;
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

  select(target: Webpage): Promise<StepOutput> {
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
