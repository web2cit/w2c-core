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

    // todo: reject empty output if mandatory field

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
