import { TranslationTest } from "./test";
import { TestDefinition } from "../types";
import log from "loglevel";

describe("Test instantiation", () => {
  it("successfully creates a test object from a definition", () => {
    const definition: TestDefinition = {
      path: "/some/path",
      fields: [
        {
          fieldname: "itemType",
          goal: ["newspaperArticle"],
        },
        {
          fieldname: "title",
          goal: ["some title"],
        },
      ],
    };
    const test = new TranslationTest(definition);
    expect(test.path).toBe("/some/path");
    expect(test.fields.length).toBe(2);
    expect(test.toJSON()).toEqual(definition);
  });

  it("skips test fields with errors", () => {
    const definition: TestDefinition = {
      path: "/some/path",
      fields: [
        {
          fieldname: "itemType",
          goal: ["invalidType"],
        },
      ],
    };
    const warnSpy = jest.spyOn(log, "warn").mockImplementation();
    const test = new TranslationTest(definition);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Failed to parse")
    );
    expect(test.fields.length).toBe(0);
  });

  it("skips duplicate test fields", () => {
    const definition: TestDefinition = {
      path: "/some/path",
      fields: [
        {
          fieldname: "itemType",
          goal: ["journalArticle"],
        },
        {
          fieldname: "itemType",
          goal: ["newspaperArticle"],
        },
      ],
    };
    const infoSpy = jest.spyOn(log, "info").mockImplementation();
    const test = new TranslationTest(definition);
    expect(infoSpy).toHaveBeenCalledWith(
      expect.stringContaining("Skipping duplicate field")
    );
    expect(test.fields.length).toBe(1);
  });
});

describe("Test field addition", () => {
  const test = new TranslationTest({
    path: "/some/path",
    fields: [
      {
        fieldname: "authorFirst",
        goal: ["first", "second"],
      },
    ],
  });

  it("successfully adds a new test field", () => {
    test.addField({
      fieldname: "itemType",
      goal: ["newspaperArticle"],
    });
    expect(test.fields.length).toBe(2);
    expect(test.fields[1].name).toBe("itemType");
  });

  it("rejects to add a duplicate test field", () => {
    expect(() => {
      test.addField({
        fieldname: "authorFirst",
        goal: [],
      });
    }).toThrow("already exists");
  });
});

describe("Test field removal", () => {
  let test: TranslationTest;
  beforeEach(() => {
    test = new TranslationTest({
      path: "/some/path",
      fields: [
        {
          fieldname: "title",
          goal: ["some title"],
        },
        {
          fieldname: "authorFirst",
          goal: ["first", "second"],
        },
      ],
    });
  });

  it("successfully removes test field", () => {
    test.removeField("authorFirst");
    expect(test.fields.length).toBe(1);
  });

  it("silently ignores non-existent field", () => {
    const infoSpy = jest.spyOn(log, "info").mockImplementation();
    test.removeField("itemType");
    expect(infoSpy).toHaveBeenCalledWith(
      expect.stringContaining("Could not remove test field")
    );
    expect(test.fields.length).toBe(2);
  });
});

describe("Translation test testing", () => {
  const test = new TranslationTest({
    path: "/some/path",
    fields: [
      {
        fieldname: "itemType",
        goal: ["newspaperArticle"],
      },
      {
        fieldname: "authorFirst",
        goal: ["first author"],
      },
    ],
  });

  it("rejects translation for different path", () => {
    expect(() => {
      test.test({
        path: "/some/other/path",
        fields: [],
      });
    }).toThrow("paths do not match");
  });

  describe("Impossible translations", () => {
    it("rejects translation with multiple values for single-value fields", () => {
      expect(() => {
        test.test({
          path: "/some/path",
          fields: [
            {
              name: "itemType", // single-value field
              output: ["newspaperArticle", "webpage"],
              valid: true,
            },
          ],
        });
      }).toThrow("Unexpected multiple output values");
    });
  });

  it("successfully tests translation output", () => {
    const result = test.test({
      path: "/some/path",
      fields: [
        {
          name: "itemType",
          output: ["newspaperArticle"],
          valid: true,
        },
        {
          name: "authorFirst",
          output: ["first"],
          valid: true,
        },
      ],
    });
    expect(result.fields.length).toBe(2);
    expect(result.fields[0].score).toBe(1);
    expect(result.fields[1].score).toBeLessThan(1);
  });

  it("treats undefined field outputs as empty", () => {
    const result = test.test({
      path: "/some/path",
      fields: [
        {
          name: "itemType",
          output: ["newspaperArticle"],
          valid: true,
        },
      ],
    });
    expect(result.fields.length).toBe(2);
    expect(result.fields[0].score).toBe(1);
    expect(result.fields[1].score).toBe(0);
  });

  it("treats invalid field outputs as empty", () => {
    const result = test.test({
      path: "/some/path",
      fields: [
        {
          name: "itemType",
          output: ["newspaperArticle"],
          valid: true,
        },
        {
          name: "authorFirst",
          output: ["first author"],
          valid: false,
        },
      ],
    });
    expect(result.fields.length).toBe(2);
    expect(result.fields[0].score).toBe(1);
    expect(result.fields[1].score).toBe(0);
  });

  it("ignores field outputs without corresponding goal", () => {
    const result = test.test({
      path: "/some/path",
      fields: [
        {
          name: "itemType",
          output: ["newspaperArticle"],
          valid: true,
        },
        {
          name: "authorFirst",
          output: ["first author"],
          valid: true,
        },
        {
          name: "authorLast",
          output: [],
          valid: true,
        },
      ],
    });
    expect(result.fields.length).toBe(2);
  });
});
