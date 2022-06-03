import { FieldName } from "../translationField";
import { TestField } from "./testField";
import log from "loglevel";
import {
  TestDefinition,
  TestOutput,
  StepOutput,
  TestFieldDefinition,
} from "../types";

// loosely based on template.ts
export class TranslationTest {
  readonly path: string;
  private _fields: Array<TestField> = [];
  // translation template constructor has a "strict" option to fail on
  // problematic fields (vs simply ignoring them)
  constructor(test: TestDefinition) {
    this.path = test.path;
    test.fields.forEach((definition) => {
      try {
        this.addField(definition);
      } catch (e) {
        if (e instanceof DuplicateFieldError) {
          log.info(`Skipping duplicate field "${e.fieldname}"`);
        } else {
          log.warn(
            `Failed to parse "${definition.fieldname}" test field definition: ${e}`
          );
        }
      }
    });
  }

  get fields(): ReadonlyArray<TestField> {
    return Object.freeze([...this._fields]);
  }

  addField(definition: TestFieldDefinition) {
    const newField = new TestField(definition);
    if (this._fields.some((field) => field.name === newField.name)) {
      throw new DuplicateFieldError(newField.name);
    } else {
      this._fields.push(newField);
    }
  }

  removeField(name: FieldName) {
    const indices = this._fields.reduce((indices: number[], field, index) => {
      if (field.name === name) indices.push(index);
      return indices;
    }, []);
    if (indices.length === 0) {
      log.info(`Could not remove test field "${name}": not found`);
    } else {
      indices.forEach((index) => {
        this._fields.splice(index, 1);
      });
    }
  }

  test(translation: {
    path: string;
    fields: {
      name: FieldName;
      output: StepOutput;
      valid: boolean;
    }[];
  }): TestOutput {
    // make sure that paths match
    if (translation.path !== this.path) {
      throw new PathMismatch(translation.path, this.path);
    }

    const testOutput: TestOutput = {
      fields: [],
    };

    for (const testField of this._fields) {
      const fieldname = testField.name;
      const outputFields = translation.fields.filter(
        (field) => field.name === fieldname
      );
      if (outputFields.length > 1) {
        throw new Error(
          `Unexpected multiple output values for field "${fieldname}"`
        );
      }
      const outputField = outputFields[0];

      let fieldOutput: StepOutput;
      if (outputField && outputField.valid) {
        fieldOutput = outputField.output;
      } else {
        // treat undefined output as empty output
        fieldOutput = [];
      }
      testOutput.fields.push({
        fieldname,
        score: testField.test(fieldname, fieldOutput),
      });
    }
    return testOutput;
  }

  toJSON(): TestDefinition {
    return {
      path: this.path,
      fields: this.fields.map((field) => field.toJSON()),
    };
  }
}

class DuplicateFieldError extends Error {
  fieldname: string;
  constructor(fieldname: string) {
    super(`Field "${fieldname}" already exists in test`);
    this.name = "Duplicate field error";
    this.fieldname = fieldname;
  }
}

class PathMismatch extends Error {
  constructor(targetPath: string, testPath: string) {
    super(
      `Cannot compare translation output for ${targetPath} ` +
        `against translation goals for ${testPath}: ` +
        `paths do not match.`
    );
    this.name = "Path mismatch error";
  }
}
