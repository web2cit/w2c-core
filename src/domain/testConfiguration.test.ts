import { TestDefinition } from "../types";
import { TestConfiguration } from "./testConfiguration";

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

it("gets all test paths", () => {
  const config = new TestConfiguration(domain, testDefinitions);
  const paths = config.paths;
  expect(paths.length).toBe(3);
  expect(paths).toEqual(testDefinitions.map((def) => def.path));
});

describe("Test array manipulation", () => {
  let config: TestConfiguration;
  beforeEach(() => {
    config = new TestConfiguration(domain, testDefinitions);
  });

  it("gets individual test object from path", () => {
    const tests = config.get("/some/path");
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
