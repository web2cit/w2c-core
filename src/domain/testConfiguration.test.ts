import { TemplateOutput, TestDefinition } from "../types";
import { TestConfiguration } from "./testConfiguration";
import log from "loglevel";
import { TestConfigurationDomainMismatch } from "../errors";

const domain = "example.com";
const testDefinitions: TestDefinition[] = [
  {
    path: "/some/path",
    fields: [
      {
        fieldname: "itemType",
        goal: ["newspaperArticle"],
      },
      {
        fieldname: "authorFirst",
        goal: [],
      },
    ],
  },
  {
    path: "/some/other/path",
    fields: [],
  },
  {
    path: "/yet/some/other/path",
    fields: [],
  },
];

it("successfully instantiates test configuration", () => {
  const config = new TestConfiguration(domain, testDefinitions);
  expect(config.toJSON()).toEqual(testDefinitions);
});

describe("Configuration object to JSON", () => {
  it("returns json from configuration initialized with tests", () => {
    const config = new TestConfiguration(domain, testDefinitions);
    expect(config.toJSON()).toEqual(testDefinitions);
  });

  it("returns json from configuration with tests added", () => {
    const config = new TestConfiguration(domain);
    const definition = testDefinitions[0];
    config.add(definition);
    expect(config.toJSON()).toEqual([definition]);
  });
});

describe("Get test paths", () => {
  const config = new TestConfiguration(domain, testDefinitions);
  it("gets all test paths", () => {
    const paths = config.paths;
    expect(paths.length).toBe(3);
    expect(paths).toEqual(testDefinitions.map((def) => def.path));
  });

  it("gets paths for non-empty tests", () => {
    const nonEmptyPaths = config.nonEmptyPaths;
    expect(nonEmptyPaths.length).toBe(1);
    expect(nonEmptyPaths[0]).toBe("/some/path");
  });
});

describe("Test array manipulation", () => {
  let config: TestConfiguration;
  beforeEach(() => {
    config = new TestConfiguration(domain, testDefinitions);
  });

  describe("Get test objects", () => {
    it("gets individual test object from path", () => {
      const tests = config.get("/some/path");
      expect(tests.length).toBe(1);
      expect(tests[0].path).toBe("/some/path");
    });

    it("url-normalizes path before using it to get test objects", () => {
      const tests = config.get("/some/../some/./path");
      expect(tests.length).toBe(1);
      expect(tests[0].path).toBe("/some/path");
    });

    it("gets multiple test objects from path array", () => {
      const pathArray = ["/some/path", "/some/other/path"];
      const tests = config.get(pathArray);
      expect(tests.length).toBe(2);
      expect(tests.map((test) => test.path)).toEqual(pathArray);
    });

    it("gets all test objects", () => {
      const tests = config.get();
      expect(tests.length).toBe(3);
      expect(tests.map((test) => test.path)).toEqual(
        testDefinitions.map((def) => def.path)
      );
    });

    // should this return a new test object with empty fields array?
    it("skips non-existent tests", () => {
      const tests = config.get("/non/existent/path");
      expect(tests.length).toBe(0);
    });
  });

  describe("Add test objects", () => {
    it("adds new test", () => {
      config.add({
        path: "/new/path",
        fields: [],
      });
      expect(config.paths.length).toBe(4);
      expect(config.paths[3]).toBe("/new/path");
    });

    it("refuses to add new test for duplicate path", () => {
      expect(() => {
        config.add({
          path: "/some/path",
          fields: [],
        });
      }).toThrow('There is a test for path "/some/path" already');
    });
  });

  describe("Remove test objects", () => {
    it("removes a test", () => {
      config.remove("/some/path");
      expect(config.paths.length).toBe(2);
    });

    it("url-normalizes path before removing a test object", () => {
      config.remove("/some/../some/./path");
      expect(config.paths.length).toBe(2);
    });

    it("skips paths not found", () => {
      const infoSpy = jest.spyOn(log, "info").mockImplementation();
      config.remove("/path/not/found");
      expect(infoSpy).toHaveBeenCalledWith(
        expect.stringContaining("Could not remove")
      );
      expect(config.paths.length).toBe(3);
    });
  });
});

describe("Configuration file parsing", () => {
  // we have to instantiate a configuration object
  // because typescript does not seem to support abstract static members
  // see https://github.com/microsoft/TypeScript/issues/34516
  const config = new TestConfiguration(domain);

  it("parses configuration string successfully", () => {
    const stringConfig = JSON.stringify(testDefinitions);
    expect(config.parse(stringConfig)).toEqual(testDefinitions);
  });

  it("rejects invalid JSON", () => {
    const stringConfig = "{invalid ]";
    expect(() => {
      config.parse(stringConfig);
    }).toThrow("Not a valid JSON");
  });

  it("rejects non-array configurations", () => {
    const stringConfig = JSON.stringify(testDefinitions[0]);
    expect(() => {
      config.parse(stringConfig);
    }).toThrow("should be an array");
  });

  it("ignores problematic tests individually", () => {
    const warnSpy = jest.spyOn(log, "warn").mockImplementation();
    const stringConfig = JSON.stringify([
      ...testDefinitions,
      {
        corrupt: "test",
      },
    ]);
    expect(config.parse(stringConfig)).toEqual(testDefinitions);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Ignoring misformatted test")
    );
  });
});

describe("Configuration loading", () => {
  let config: TestConfiguration;
  beforeEach(() => {
    config = new TestConfiguration(domain);
  });

  it("loads configuration successfully", () => {
    config.loadConfiguration(testDefinitions);
    expect(config.paths.length).toBe(3);
    expect(config.toJSON()).toEqual(testDefinitions);
  });

  it("skips multiple tests for the same path", () => {
    const infoSpy = jest.spyOn(log, "info").mockImplementation();
    config.loadConfiguration([
      ...testDefinitions,
      {
        path: "/some/path",
        fields: [],
      },
    ]);
    expect(infoSpy).toHaveBeenCalledWith(
      expect.stringContaining("Skipping duplicate test")
    );
    expect(config.toJSON()).toEqual(testDefinitions);
  });
});

describe("Translation output scoring", () => {
  const config = new TestConfiguration(domain, testDefinitions);
  const output = {
    target: {
      domain: "example.com",
      path: "/some/path",
    },
    outputs: [
      {
        fieldname: "itemType",
        output: ["newspaperArticle"],
        valid: true,
      },
      {
        fieldname: "authorFirst",
        output: [],
        valid: true,
      },
    ],
  } as TemplateOutput;

  it("scores translation output", () => {
    const result = config.score(output);
    expect(result.fields[0].score).toBe(1);
    expect(result.fields[1].score).toBe(1);
  });

  it("rejects translation outputs from another domain", () => {
    // deep copy output object before changing
    const alienOutput = JSON.parse(JSON.stringify(output));
    alienOutput.target.domain = "alien.com";
    expect(() => {
      config.score(alienOutput);
    }).toThrow(TestConfigurationDomainMismatch);
  });

  it("handles translation output for path without test", () => {
    // deep copy output object before changing
    const notestOutput = JSON.parse(JSON.stringify(output));
    notestOutput.target.path = "/path/without/test";
    const result = config.score(notestOutput);
    expect(result.fields.length).toBe(0);
  });
});
