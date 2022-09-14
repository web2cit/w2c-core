import { PathPattern } from "../patterns/pattern";
import { DomainConfiguration } from "./domainConfiguration";
import log from "loglevel";
import { isPatternDefinition, PatternDefinition } from "../types";
import { normalizeUrlPath } from "../utils";

export class PatternConfiguration extends DomainConfiguration<
  PathPattern,
  PatternDefinition
> {
  private patterns: PathPattern[];
  readonly catchall: Readonly<PathPattern> | null;
  constructor(
    domain: string,
    patterns?: PatternDefinition[],
    useCatchall = true
  ) {
    super(domain, "patterns.json");
    this.patterns = this.values;
    this.catchall = useCatchall ? PathPattern.catchall : null;
    if (patterns) this.loadConfiguration(patterns);
  }

  get(patterns?: string | string[] | undefined): PathPattern[] {
    let patternObjs: PathPattern[];
    if (patterns === undefined) {
      patternObjs = [...this.patterns];
    } else {
      const patternArray = Array.isArray(patterns) ? patterns : [patterns];
      patternObjs = this.patterns.filter((pattern) =>
        patternArray.includes(pattern.pattern)
      );
    }
    return patternObjs;
  }

  // todo: do we want a method to edit a pattern
  // to make sure that the currentRevid is set to undefined upon changes?

  add(definition: PatternDefinition, index?: number): PathPattern {
    const newPattern = new PathPattern(definition.pattern, definition.label);
    if (
      this.patterns.some((pattern) => pattern.pattern === newPattern.pattern)
    ) {
      // silently ignore patterns already in the list
      log.info(`Pattern ${definition.pattern} already in the pattern list`);
    } else if (
      this.catchall !== null &&
      this.catchall.pattern === newPattern.pattern
    ) {
      // silently ignore pattern matching the catchall pattern
      log.info(`Pattern ${definition.pattern} matches the catchall pattern`);
    } else {
      if (index !== undefined) {
        this.patterns.splice(index, 0, newPattern);
      } else {
        this.patterns.push(newPattern);
      }
      this.currentRevid = undefined;
    }
    return newPattern;
  }

  move(pattern: string, newIndex: number): void {
    const oldIndex = this.patterns.findIndex((patternObj) => {
      patternObj.pattern === pattern;
    });
    const patternObj = this.patterns[oldIndex];
    if (patternObj !== undefined) {
      this.patterns.splice(newIndex, 0, patternObj);
      this.currentRevid = undefined;
    }
  }

  remove(pattern: string): void {
    const index = this.patterns.findIndex((patternObj) => {
      patternObj.pattern === pattern;
    });
    if (index > -1) {
      this.patterns.splice(index, 1);
      this.currentRevid = undefined;
    }
  }

  parse(content: string): PatternDefinition[] {
    let definitions;
    try {
      definitions = JSON.parse(content) as unknown;
    } catch {
      throw new Error("Not a valid JSON");
    }
    if (!(definitions instanceof Array)) {
      throw new Error("Pattern configuration should be an array of patterns");
    }
    const patternDefinitions = definitions.reduce(
      (patternDefinitions: PatternDefinition[], definition, index) => {
        if (isPatternDefinition(definition)) {
          patternDefinitions.push(definition);
        } else {
          log.info(`Ignoring misformatted pattern at index ${index}`);
        }
        return patternDefinitions;
      },
      []
    );
    return patternDefinitions;
  }

  loadConfiguration(patterns: PatternDefinition[]) {
    if (this.catchall === undefined) {
      throw new Error(
        "Catchall pattern must be defined before loading pattern configuration"
      );
    }
    patterns.forEach((definition) => {
      this.add(definition);
    });
  }

  sortPaths(paths: PathString[] | PathString): Map<PatternString, PathString[]>;
  sortPaths(
    paths: PathString[] | PathString,
    targetPattern: PatternString
  ): PathString[];
  sortPaths(
    paths: PathString[] | PathString,
    targetPattern?: PatternString
  ): Map<PatternString, PathString[]> | PathString[] {
    const output: Map<PatternString, Array<PathString>> = new Map();

    const patterns: Array<PathPattern | Readonly<PathPattern>> = [
      ...this.patterns,
    ];
    if (this.catchall) patterns.push(this.catchall);

    if (
      targetPattern !== undefined &&
      patterns.every((pattern) => pattern.pattern !== targetPattern)
    ) {
      // immediately return an empty array if the target pattern is not in the pattern list
      return [];
      // throw new Error(`Pattern "${targetPattern}" not in the pattern list`);
    }
    if (!Array.isArray(paths)) {
      paths = [paths];
    }
    // paths = paths.map(normalizeUrlPath);

    let pendingPaths = [...paths];
    for (const pattern of patterns) {
      const matches: PathString[] = [];
      const newPending: PathString[] = [];
      for (const path of pendingPaths) {
        if (pattern.match(path)) {
          matches.push(path);
        } else {
          newPending.push(path);
        }
      }
      if (matches.length) output.set(pattern.pattern, matches);
      pendingPaths = newPending;
      if (pattern.pattern === targetPattern) break;
    }
    if (targetPattern) {
      return output.get(targetPattern) ?? [];
    } else {
      return output;
    }
  }
}

type PathString = string;
type PatternString = string;
