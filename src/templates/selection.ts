import { TranslationStep, StepOutput, StepDefinition } from "./step";
import { TargetUrl } from "../targetUrl";
import { SimpleCitoidField, isSimpleCitoidField } from "../citoid";
import { JSDOM } from "jsdom";

export abstract class Selection extends TranslationStep {
  abstract readonly type: SelectionType;

  protected abstract _config: string;
  abstract get config(): string;
  abstract set config(config: string);

  apply = this.select;
  abstract select(target: TargetUrl): Promise<StepOutput>;
  abstract suggest(target: TargetUrl, query: string): Promise<string>;

  static create(selection: SelectionDefinition) {
    const value = selection.value;
    switch (selection.type) {
      case "citoid":
        // assume value is SimpleCitoidField and let constructor fail otherwise
        return new CitoidSelection(value as SimpleCitoidField);
        break;
      case "xpath":
        return new XPathSelection(value);
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

export class XPathSelection extends Selection {
  readonly type: SelectionType = "xpath";
  protected _config = "";
  private _parsedXPath: XPathExpression | undefined;
  private readonly window = new JSDOM().window;
  constructor(expression?: XPathSelection["_config"]) {
    super();
    if (expression) this.config = expression;
  }

  get config(): XPathSelection["_config"] {
    return this._config;
  }

  set config(expression: string) {
    try {
      const window = new JSDOM().window;
      this._parsedXPath = window.document.createExpression(expression);
      this._config = expression;
      window.close();
    } catch {
      throw new SelectionConfigTypeError(this.type, expression);
    }
  }

  select(target: TargetUrl): Promise<StepOutput> {
    if (this._parsedXPath === undefined) {
      throw new UndefinedSelectionConfigError();
    }
    const parsedXPath = this._parsedXPath;
    return new Promise((resolve, reject) => {
      target.cache.http
        .getData(false)
        .then((data) => {
          const selection: StepOutput = [];
          try {
            const result = parsedXPath.evaluate(
              data.doc,
              this.window.XPathResult.ORDERED_NODE_ITERATOR_TYPE
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
              this.window.XPathResult.ANY_TYPE
            );
            switch (result.resultType) {
              case this.window.XPathResult.NUMBER_TYPE:
                selection.push(result.numberValue.toString());
                break;
              case this.window.XPathResult.STRING_TYPE:
                selection.push(result.stringValue);
                break;
              case this.window.XPathResult.BOOLEAN_TYPE:
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

  suggest(
    target: TargetUrl,
    query: string
  ): Promise<XPathSelection["_config"]> {
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

export type SelectionDefinition = StepDefinition;
