import { FieldName, TranslationField } from "../translationField";
import { StepOutput, TestFieldDefinition } from "../types";
import log from "loglevel";
import { diff_match_patch } from "diff-match-patch";

export class TestField extends TranslationField {
  readonly goal: StepOutput;
  constructor(field: TestFieldDefinition) {
    const { fieldname } = field;
    let { goal } = field;
    super(fieldname);
    if (this.params.control) {
      // translation tests should not include control fields
      throw new Error(`Translation field ${this.name} is a control field!`);
    }

    // todo: reject empty output for mandatory fields
    // note that it is not the same as missing mandatory field
    // that's ok because it means it hasn't been declared

    if (!this.params.array && goal.length > 1) {
      log.warn(
        `Ignoring additional goal values for single-valued ${fieldname} field`
      );
      goal = [goal[0]!];
    }
    goal.forEach((value) => {
      if (!this.pattern.test(value)) {
        throw new Error(
          `"${value}" is not a valid goal value for field "${fieldname}"`
        );
      }
    });
    this.goal = goal;
  }

  // we may need methods to add/move/remove goal values later on

  test(fieldname: FieldName, output: StepOutput): number {
    if (fieldname !== this.name) {
      throw new FieldnameMismatch(fieldname, this.name);
    }

    if (!this.params.array && output.length > 1) {
      throw new Error(
        `Unexpected multiple output values for field "${this.name}"`
      );
    }

    if (this.params.forceRequired && output.length === 0) {
      throw new Error(
        `Unexpected empty output for mandatory field "${this.name}"`
      );
    }

    let score: number;

    // todo: set diff strategy at the translation field config level
    // consider having different diff strategies:
    // * ordered list
    // * unordered list
    // * dates (boolean-compare components)
    // * boolean (webpage is not newspaperArticle)
    // * distance

    // combine them
    // ordered/unordered
    // add gaps/don't add
    // boolean/distance

    // in the meantime, doing some hard-coding below
    if (fieldname === "itemType") {
      if (this.params.array) {
        throw new Error(
          'Unexpected multiple-value config for field "itemType"'
        );
      }
      score = output[0] === this.goal[0] ? 1 : 0;
    } else if (fieldname === "date") {
      if (this.params.array) {
        throw new Error(
          'Unexpected multiple-value config for field "itemType"'
        );
      }
      if (output[0] === this.goal[0]) {
        score = 1;
      } else {
        const outputDateArray = (output[0] ?? "").split("-");
        const goalDateArray = (this.goal[0] ?? "").split("-");
        const maxLength = Math.max(
          outputDateArray.length,
          goalDateArray.length
        );
        score = 0;
        for (let i = 0; i < maxLength; i++) {
          score += +(outputDateArray[i] === goalDateArray[i]) / maxLength;
        }
      }
    } else {
      const dmp = new diff_match_patch();
      // should ["one", "two", "three"] vs ["one", "four", "three"]
      // have higher score than vs ["one", "three"]?
      const outputString = output.join();
      const goalString = output.join();
      const diff = dmp.diff_main(outputString, goalString);
      const distance = dmp.diff_levenshtein(diff);
      score = distance / Math.max(outputString.length, goalString.length);
    }
    return score;
  }

  toJSON(): TestFieldDefinition {
    return {
      fieldname: this.name,
      goal: this.goal,
    };
  }
}

export function getDiffScore(
  source: Array<string | undefined>,
  target: Array<string | undefined>,
  // todo: default compareFn may be a simple levenshtein distance function
  compareFn: (value1: string, value2: string) => number,
  strategy: "ordered" | "unordered" | "mixed" = "mixed"
): number {
  const maxLength = Math.max(source.length, target.length);
  let orderedScore = 0;
  let unorderedScore = 0;

  if (strategy === "ordered" || strategy === "mixed") {
    for (let i = 0; i < maxLength; i++) {
      const sourceValue = source[i];
      const targetValue = target[i];
      if (sourceValue === undefined || targetValue === undefined) {
        orderedScore += 0;
      } else {
        orderedScore += compareFn(sourceValue, targetValue) / maxLength;
      }
    }
  }

  if (strategy === "unordered" || strategy === "mixed") {
    const indices = [...Array(maxLength).keys()];
    const indexPermutations = permute(indices);
    for (const indexPermutation of indexPermutations) {
      const targetPermutation = indexPermutation.map((i) => target[i]);
      const score = getDiffScore(
        source,
        targetPermutation,
        compareFn,
        "ordered"
      );
      unorderedScore = Math.max(unorderedScore, score);
    }
  }
  let score = orderedScore + unorderedScore;
  if (strategy === "mixed") score = score / 2;
  return score;
}

// https://medium.com/weekly-webtips/step-by-step-guide-to-array-permutation-using-recursion-in-javascript-4e76188b88ff
function permute<T>(input: T[]): T[][] {
  const result = [];
  if (input.length === 0) return [];
  if (input.length === 1) return [input];

  for (let i = 0; i < input.length; i++) {
    // copy input array
    const remainingItems = [...input];
    // splice changes the remainingItems array
    const currentItemArray = remainingItems.splice(i, 1);

    const remainingItemPermutations = permute(remainingItems);
    for (const remainingItemPermutation of remainingItemPermutations) {
      const permutation = currentItemArray.concat(remainingItemPermutation);
      result.push(permutation);
    }
  }
  return result;
}

class FieldnameMismatch extends Error {
  constructor(translationFieldname: FieldName, testFieldname: FieldName) {
    super(
      `Cannot compare translation output for field "${translationFieldname}" ` +
        `against translation goals for field "${testFieldname}": ` +
        `field names do not match.`
    );
    this.name = "Field name mismatch error";
  }
}
