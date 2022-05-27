// We don't need a Webpage object because we will just compare template outputs
// vs translation tests.
// Alternatively, we could make the translate logic live inside a test object.
// But no. What we may do instead is have the webpage object know how to translate
// and test itself. But I'm not sure why we would want that now.

// We don't need to know what domain the test belongs to, then. In the template, we
// need to know the domain because there are steps that need to download the target
// or its Citoid response. Not here.

// test method input:
// * path
// * fields
// ** fieldname
// ** output

// loosely based on template.ts

import { FieldName } from "../translationField";
import { TestField } from "./testField";
import log from "loglevel";
import { TestDefinition, TestOutput, TemplateOutput } from "../types";

export class TranslationTest {
  readonly path: string;
  private _fields: Array<TestField> = [];
  protected constructor(test: TestDefinition) {
    this.path = test.path;
    if (test.fields) {
      test.fields.forEach((definition) => {
        let field;
        try {
          field = new TestField(definition);
        } catch (e) {
          const fieldname = definition.fieldname ?? "untitled";
          log.warn(
            `Failed to parse "${fieldname}" test field definition: ${e}`
          );
        }
        if (field !== undefined) {
          try {
            this.addField(field);
          } catch (e) {
            if (e instanceof DuplicateFieldError) {
              log.info(`Skipping duplicate field "${field.name}"`);
            } else {
              log.info(``);
              throw e;
            }
          }
        }
      });
    }
  }

  get fields(): ReadonlyArray<TestField> {
    return Object.freeze([...this._fields]);
  }

  addField(newField: TestField) {
    if (this._fields.some((field) => field.name === newField.name)) {
      throw new DuplicateFieldError(newField.name);
    } else {
      this._fields.push(newField);
    }
  }

  removeField(name: FieldName, order?: number) {
    const indices = this._fields.reduce((indices: number[], field, index) => {
      if (field.name === name) indices.push(index);
      return indices;
    }, []);
    const index = indices[order === undefined ? indices.length - 1 : order];
    if (index !== undefined) this._fields.splice(index, 1);
  }

  // ```
  // Will we blindly compare translation template output vs translation test goals
  // without making sure they both belong to the same domain?
  // ```;

  // we don't need all properties of the TemplateOutput
  // normalize output interfaces: T302431
  test(translation: TemplateOutput): TestOutput {
    // do we need to make sure that domain matches?

    // make sure that paths match
    if (translation.target.path !== this.path) {
      throw new PathMismatch(translation.target.path, this.path);
    }

    const output: TestOutput = {
      fields: [],
    };

    for (const testField of this._fields) {
      const fieldname = testField.name;
      const outputFields = translation.outputs.filter(
        (outputField) => outputField.fieldname === fieldname
      );
      if (outputFields.length > 1) {
        throw new Error(
          `Unexpected multiple template outputs for field ${fieldname}`
        );
      }
      const outputField = outputFields[0];
      output.fields.push({
        fieldname,
        score: 0, //testField.test(outputField)
      });
    }

    return output;
  }

  toJSON(): TestDefinition {
    return {
      path: this.path,
      fields: this.fields.map((field) => field.toJSON()),
    };
  }
}

class DuplicateFieldError extends Error {
  constructor(fieldname: string) {
    super(`Field "${fieldname}" already exists in test`);
    this.name = "Duplicate field error";
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
