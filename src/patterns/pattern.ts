import minimatch from "minimatch";
import { PatternDefinition } from "../types";
import { normalizeUrlPath } from "../utils";

export class PathPattern {
  label: string;
  readonly pattern: string;
  private regexp = new RegExp("");
  constructor(pattern: string, label?: string) {
    try {
      this.regexp = minimatch.makeRe(pattern);
      this.pattern = pattern;
    } catch {
      throw new Error(`${pattern} is not a valid glob pattern`);
    }
    this.label = label || "";
  }

  static catchall = Object.freeze(new PathPattern("**"));

  match(path: string): boolean {
    // ignore query string
    // use control template field to handle these

    // see https://github.com/microsoft/TypeScript/issues/41638
    path = path.split("?")[0] as string;

    path = normalizeUrlPath(path);

    return this.regexp.test(path);
  }

  toJSON(): PatternDefinition {
    return {
      pattern: this.pattern,
      label: this.label,
    };
  }
}
