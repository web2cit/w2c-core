import { FieldName, TranslationField } from "../translationField";
import { StepOutput, TestFieldDefinition } from "../types";
import log from "loglevel";
import levenshtein from "fastest-levenshtein";

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

    if (this.params.forceRequired && goal.length === 0) {
      throw new Error(`Invalid empty goal for mandatory field "${fieldname}"`);
    }

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

    // todo: consider stating how to get diff score
    // at the translation field level (i.e., translationField.ts)
    let compareFn;
    if (fieldname === "itemType") {
      compareFn = boolCompare;
    } else if (fieldname === "date") {
      compareFn = dateCompare;
    } else {
      compareFn = stringCompare;
    }
    return getDiffScore(output, this.goal, compareFn);
  }

  toJSON(): TestFieldDefinition {
    return {
      fieldname: this.name,
      goal: this.goal,
    };
  }
}

function getDiffScore(
  source: Array<string | undefined>,
  target: Array<string | undefined>,
  // todo: default compareFn may be a simple levenshtein distance function
  compareFn: (value1: string, value2: string) => number = stringCompare,
  strategy?: "ordered" | "unordered" | "mixed"
): number {
  const maxLength = Math.max(source.length, target.length);

  if (maxLength === 0) {
    // empty arrays match perfectly
    return 1;
  }

  // set default strategy
  if (strategy === undefined) {
    if (maxLength > 1) {
      strategy = "mixed";
    } else {
      // do not process same score twice if longest array is 0 or 1 items long
      strategy = "ordered";
    }
  }
  let orderedScore = 0;
  let unorderedScore = 0;

  if (strategy === "ordered" || strategy === "mixed") {
    for (let i = 0; i < maxLength; i++) {
      let score;
      const sourceValue = source[i];
      const targetValue = target[i];
      if (sourceValue === targetValue) {
        // covers the case where both values are undefined
        score = 1;
      } else if (sourceValue === undefined || targetValue === undefined) {
        score = 0;
      } else {
        score = compareFn(sourceValue, targetValue);
      }
      orderedScore += score / maxLength;
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

function boolCompare(value1: string, value2: string): number {
  const score = value1 === value2 ? 1 : 0;
  return score;
}

function dateCompare(value1: string, value2: string): number {
  const dateArr1 = value1.split("-");
  const dateArr2 = value2.split("-");
  const maxLength = Math.max(dateArr1.length, dateArr2.length);
  let score = 0;
  for (let i = 0; i < maxLength; i++) {
    score += +(dateArr1[i] === dateArr2[i]) / maxLength;
  }
  return score;
}

function stringCompare(value1: string, value2: string): number {
  const distance = levenshtein.distance(value1, value2);
  const score = 1 - distance / Math.max(value1.length, value2.length);
  return score;
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
