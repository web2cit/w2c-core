import { TranslationTest } from "../tests/test";
import { DomainConfiguration } from "./domainConfiguration";
import log from "loglevel";
import { TemplateOutput, TestDefinition, TestOutput } from "../types";

export class TestConfiguration extends DomainConfiguration<
  TranslationTest,
  TestDefinition
> {
  private tests: TranslationTest[];
  constructor(domain: string, tests: TestDefinition[] = []) {
    super(domain, "tests.json");
    this.tests = this.values;
    if (tests) this.loadConfiguration(tests);
  }

  get paths(): string[] {
    return this.tests.map((test) => test.path);
  }

  get(paths?: string | string[]): TranslationTest[] {
    let tests: TranslationTest[];
    if (paths === undefined) {
      // return all tests if no specific path specified
      tests = [...this.tests];
    } else {
      const pathArray = Array.isArray(paths) ? paths : [paths];
      tests = this.tests.filter((test) => pathArray.includes(test.path));
    }
    return tests;
  }

  // todo: do we want a method to edit a test
  // to make sure that the currentRevid is set to undefined upon changes?

  add(definition: TestDefinition): TranslationTest {
    // may the test constructor make changes to the path?
    const newTest = new TranslationTest(definition);
    if (this.tests.some((test) => test.path === newTest.path)) {
      throw new DuplicateTestPathError(definition.path);
    }
    this.tests.push(newTest);
    this.currentRevid = undefined;
    return newTest;
  }

  remove(path: string): void {
    const index = this.tests.findIndex((test) => test.path === path);
    if (index > -1) {
      this.tests.splice(index, 1);
      log.info(`Test for path ${path} at index ${index} successfully removed`);
    } else {
      log.info(`Could not remove test for path ${path}. No test found`);
    }
  }

  // parse configuration file
  parse(content: string): TestDefinition[] {
    let definitions;
    try {
      definitions = JSON.parse(content) as unknown;
    } catch {
      throw new Error("Not a valid JSON");
    }
    if (!(definitions instanceof Array)) {
      throw new Error("Test configuration should be an array of tests");
    }
    const testDefinitions = definitions.reduce(
      (testDefinitions: TestDefinition[], definition, index) => {
        // create tests from definitions, skip individual invalid elements, and
        // convert back to json definitions; see T305267
        try {
          const test = new TranslationTest(definition);
          testDefinitions.push(test.toJSON());
        } catch (error) {
          let info = "Ignoring misformatted test";
          if ("path" in definition) {
            info = info + ` for path "${definition.path}"`;
          } else {
            info = info + ` at index ${index}`;
          }
          log.warn(info + `: ${error}`);
        }
        return testDefinitions;
      },
      []
    );
    return testDefinitions;
  }

  loadConfiguration(tests: TestDefinition[]): void {
    this.tests = [];
    tests.forEach((definition) => {
      try {
        this.add(definition);
      } catch (e) {
        if (e instanceof DuplicateTestPathError) {
          // silently ignore duplicate test paths
          log.info(`Skipping duplicate test for path ${definition.path}`);
        } else {
          throw e;
        }
      }
    });
  }

  score(translation: TemplateOutput): TestOutput {
    let test = this.get(translation.target.path)[0];
    // let test = this.tests.filter(
    //   (test) => test.path === translation.target.path
    // )[0];
    if (test === undefined)
      test = new TranslationTest({
        path: translation.target.path,
        fields: [],
      });
    const result = test.test({
      path: translation.target.path,
      fields: translation.outputs.map((output) => {
        return {
          name: output.fieldname,
          output: output.output,
          valid: output.valid,
        };
      }),
    });
    return result;
  }
}

class DuplicateTestPathError extends Error {
  constructor(path: string) {
    super(`There is a test for path ${path} already`);
    this.name = "Duplicate test path error";
  }
}