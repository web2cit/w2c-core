import { PathPattern, PatternDefinition } from "../pattern";
import { DomainConfiguration } from "./domainConfiguration";

export class PatternConfiguration extends DomainConfiguration<
  PathPattern, PatternDefinition
> {
  constructor(
    domain: string,
    configuration?: PatternDefinition,
  ) {
    super(
      domain, 'templates.json', 'templates', configuration
    );
  }

  get() { return [] };

  add() { return new PathPattern('') };

  move() { return };

  remove() { return };

  parse() { return [] };

  toJSON() { return {'pattern': ''} }
}

//   patterns // ??
//   readonly catchallPattern: Readonly<PathPattern> | undefined; //???

//   constructor(
//     patterns?: Array<PatternDefinition>;
//     catchallPattern = true

//   ) {
//     definition.patterns.forEach((patternDef) => this.addPattern(patternDef));

//   }

//   // do i need these?

//   get patterns() {
//     const patterns = [...this._patterns];
//     return Object.freeze(patterns);
//   }

//   set patterns(patterns) {
//     throw new Error(
//       `Cannot set patterns. Use add/move/removePattern methods instead`
//     );
//   }




//     // fixme:
//   // running any of these should change the corresponding revid?
//   // beware: also mutating one of the templates, patterns, etc!!

//     addPattern(definition: PatternDefinition, index?: number): PathPattern {
//         const newPattern = new PathPattern(definition.pattern, definition.label);
//         if (
//           this._patterns.some((pattern) => pattern.pattern === newPattern.pattern)
//         ) {
//           // silently ignore patterns already in the list
//           log.info(`Pattern ${definition.pattern} already in the pattern list`);
//         } else if (
//           this.catchallPattern &&
//           this.catchallPattern.pattern === newPattern.pattern
//         ) {
//           // silently ignore pattern matching the catchall pattern
//           log.info(`Pattern ${definition.pattern} matches the catchall pattern`);
//         } else {
//           if (index !== undefined) {
//             this._patterns.splice(index, 0, newPattern);
//           } else {
//             this._patterns.push(newPattern);
//           }
//         }
//         return newPattern;
//       }
    
//       getPattern(pattern: string): PathPattern | undefined {
//         const index = this._patterns.findIndex(
//           (patternObj) => patternObj.pattern === pattern
//         );
//         return this._patterns[index];
//       }
    
//       movePattern(pattern: string, newIndex: number): void {
//         const oldIndex = this._patterns.findIndex((patternObj) => {
//           patternObj.pattern === pattern;
//         });
//         const patternObj = this._patterns[oldIndex];
//         if (patternObj !== undefined) {
//           this._patterns.splice(newIndex, 0, patternObj);
//         }
//       }
    
//       removePattern(pattern: string): void {
//         const index = this._patterns.findIndex((patternObj) => {
//           patternObj.pattern === pattern;
//         });
//         if (index > -1) this._patterns.splice(index, 1);
//       }

//       async fetchPatterns(): Promise<void> {
//         // update patternsRevID
//         return;
//       }

//       sortPaths(paths: PathString[] | PathString): Map<PatternString, PathString[]>;
//       sortPaths(
//         paths: PathString[] | PathString,
//         targetPattern: PatternString
//       ): PathString[];
//       sortPaths(
//         paths: PathString[] | PathString,
//         targetPattern?: PatternString
//       ): Map<PatternString, PathString[]> | PathString[] {
//         const output: Map<PatternString, Array<PathString>> = new Map();
//         if (
//           targetPattern !== undefined &&
//           // fixme: inject catchall pattern
//           this._patterns.every((pattern) => pattern.pattern !== targetPattern)
//         ) {
//           // immediately return an empty array if the target pattern is not in the pattern list
//           return [];
//           // throw new Error(`Pattern "${targetPattern}" not in the pattern list`);
//         }
//         if (!Array.isArray(paths)) {
//           paths = [paths];
//         }
//         let pendingPaths = [...paths];
//         for (const pattern of this._patterns) {
//           const matches: PathString[] = [];
//           const newPending: PathString[] = [];
//           for (const path of pendingPaths) {
//             if (pattern.match(path)) {
//               matches.push(path);
//             } else {
//               newPending.push(path);
//             }
//           }
//           if (matches.length) output.set(pattern.pattern, matches);
//           pendingPaths = newPending;
//           if (pattern.pattern === targetPattern) break;
//         }
//         if (targetPattern) {
//           return output.get(targetPattern) ?? [];
//         } else {
//           return output;
//         }
//       }
    
// }