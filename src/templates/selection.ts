import { TranslationStep, StepOutput } from "./step";
import { TargetUrl } from "../targetUrl";
import { SimpleCitoidField, isSimpleCitoidField } from "../citoid";
import * as xpath from "xpath-ts";

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

export class XPathSelection extends Selection {
  // xpath library implements XPath 1.0
  // xpath recommends xmldom, but
  // xmldom would be very strict and does not work well with real HTML pages
  // see https://stackoverflow.com/questions/16010551/getting-element-using-xpath-and-cheerio
  // alternatively, use XPath built-in support (?) in (larger) JSDOM (xpath-jsdom branch)
  readonly type: SelectionType = "xpath";
  protected _config = "";
  private _parsedXPath: ReturnType<typeof xpath.parse> | undefined;
  constructor(expression?: XPathSelection["_config"]) {
    super();
    if (expression) this.config = expression;
  }

  get config(): XPathSelection["_config"] {
    return this._config;
  }

  set config(expression: string) {
    try {
      this._parsedXPath = xpath.parse(expression);
      this._config = expression;
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
          // todo: return ordered set of nodes
          const result = parsedXPath.evaluate({ node: data.doc, isHtml: true });
          let selection: StepOutput;
          try {
            selection = result.nodeset.toArray().map((node) => {
              if (isHTMLElement(node)) {
                // nodes do not seem to implement innerText
                // same thing goes with JSDOM (instead of xmldom)
                // https://github.com/goto100/xpath/issues/93#issuecomment-1028938098
                // console.log(`HTMLElement: ${node}`)
                return node.innerText;
              } else if (isAttr(node)) {
                return node.value;
              } else {
                // xmldom preserves text nodes between elements
                // see https://github.com/xmldom/xmldom/issues/44#issuecomment-904114631
                // console.log(`Node: ${node}`)
                return node.textContent ?? "";
              }
            });
          } catch {
            selection = [result.toString()];
          }
          resolve(selection);
        })
        .catch((reason) => {
          reject(reason);
        });
    });
  }

  // alternative select function using xpath's select
  // (instead of parse > evaluate)
  _select(target: TargetUrl): Promise<StepOutput> {
    if (this.config === "") {
      throw new UndefinedSelectionConfigError();
    }
    const expression = this.config;
    return new Promise((resolve, reject) => {
      target.cache.http
        .getData(false)
        .then((data) => {
          const selectFn = xpath.select;
          // html dom nodes have namespaces
          // see https://github.com/goto100/xpath/issues/27
          // ignoring namespaces seems to be available with parse > evaluate only
          // const selectFn = xpath.useNamespaces({html: 'http://www.w3.org/1999/xhtml'});
          const xpathSelection = selectFn(expression, data.doc);
          const xpathSelectionArray = Array.isArray(xpathSelection)
            ? xpathSelection
            : [xpathSelection];
          const selection = xpathSelectionArray.map((value) => {
            if (value instanceof Object) {
              if (isHTMLElement(value)) {
                console.log(`HTMLElement: ${value}`);
                return value.innerText;
              } else if (isAttr(value)) {
                return value.value;
              } else {
                console.log(`Node: ${value}`);
                return value.textContent ?? "";
              }
            } else {
              return value.toString();
            }
          });
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
