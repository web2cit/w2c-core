import minimatch from "minimatch";
import { normalize } from "path";

export class PathPattern {
  label: string;
  private _pattern = "";
  private regexp = new RegExp("");
  constructor(pattern: string, label?: string) {
    this.pattern = pattern;
    this.label = label || "";
  }

  get pattern(): string {
    return this._pattern;
  }

  set pattern(pattern: string) {
    try {
      this.regexp = minimatch.makeRe(pattern);
      this._pattern = pattern;
    } catch {
      throw new Error(`${pattern} is not a valid glob pattern`);
    }
  }

  match(path: string): boolean {
    // ignore query string
    // use control template field to handle these
    path = path.split("?")[0];

    path = normalize(path);

    return this.regexp.test(path);
  }
}
