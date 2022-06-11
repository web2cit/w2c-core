import { TemplateDefinition } from "../types";
import { Domain } from "./domain";
import { TemplateConfiguration } from "./templateConfiguration";

const template: TemplateDefinition = {
  path: "/template1",
  label: "applicable",
  fields: [
    {
      fieldname: "itemType",
      required: true,
      procedures: [
        {
          selections: [{ type: "fixed", config: "newspaperArticle" }],
          transformations: [],
        },
      ],
    },
    {
      fieldname: "title",
      required: true,
      procedures: [
        {
          selections: [{ type: "fixed", config: "title abc" }],
          transformations: [],
        },
      ],
    },
  ],
};

describe("Domain class", () => {
  test("domain property is initialized", () => {
    expect(new Domain("example.com").domain).toBe("example.com");
  });
});

it("does not make citatations for non-applicable template outputs", async () => {
  const domain = new Domain("example.com", {
    templates: [
      {
        path: "/template2",
        label: "non-applicable",
        fields: [
          {
            fieldname: "itemType",
            required: true,
            procedures: [
              {
                selections: [],
                transformations: [],
              },
            ],
          },
          {
            fieldname: "title",
            required: true,
            procedures: [
              {
                selections: [],
                transformations: [],
              },
            ],
          },
        ],
      },
      template,
    ],
  });
  const translationOutput = await domain.translate("/target", {
    onlyApplicable: false,
  });
  const templateOutputs = translationOutput[0].translation.outputs;
  expect(templateOutputs.length).toBe(2);
  expect(templateOutputs[0].template.applicable).toBe(false);
  expect(templateOutputs[0].citation).toBeUndefined();
  expect(templateOutputs[1].template.applicable).toBe(true);
  expect(templateOutputs[1].citation).toBeDefined();
});

it("creates Domain object from URL", () => {
  const domain = Domain.fromURL("https://example.com/some/path");
  expect(domain.domain).toBe("example.com");
});

it("includes translation score in translation outputs", async () => {
  const domain = new Domain("example.com", {
    templates: [template],
    tests: [
      {
        path: "/target/path",
        fields: [
          {
            fieldname: "itemType",
            goal: ["newspaperArticle"],
          },
          {
            fieldname: "title",
            goal: ["title xyz"],
          },
        ],
      },
    ],
  });
  const results = await domain.translate("/target/path");
  const result = results[0];
  const output = result.translation.outputs[0];
  expect(output.scores.fields).toEqual([
    {
      fieldname: "itemType",
      score: 1,
    },
    {
      fieldname: "title",
      score: 1 - 3 / 9, // "title abc" vs "title xyz"
    },
  ]);
});

describe("Multiple-target translation", () => {
  it("translates targets matching the same url path pattern", async () => {
    const domain = new Domain("example.com", {
      templates: [template],
    });
    const results = await domain.translate([
      "/target/path",
      "/other/target/path",
    ]);
    expect(results.length).toBe(2);
    expect(
      results[0].translation.pattern === results[1].translation.pattern
    ).toBe(true);
  });

  it("translates targets matching different url path patterns", async () => {
    const domain = new Domain("example.com", {
      templates: [template],
      patterns: [
        {
          pattern: "/target/*",
        },
      ],
    });
    const results = await domain.translate([
      "/target/path",
      "/other/target/path",
    ]);
    expect(results.length).toBe(2);
    expect(results[0].translation.pattern).toBe("/target/*");
    expect(results[1].translation.pattern).toBe(
      domain.patterns.catchall?.pattern
    );
  });
});

describe("Get template and test paths", () => {
  it("gets all paths in template and test configurations", async () => {
    const domain = new Domain("example.com", {
      templates: [template],
      tests: [
        {
          path: "/target/path",
          fields: [
            {
              fieldname: "itemType",
              goal: ["webpage"],
            },
          ],
        },
      ],
    });
    const paths = await domain.getPaths();
    expect(paths.length).toBe(2);
  });

  it("does not get path both in template and test config twice", async () => {
    const domain = new Domain("example.com", {
      templates: [template],
      tests: [
        {
          path: template.path,
          fields: [
            {
              fieldname: "itemType",
              goal: ["webpage"],
            },
          ],
        },
      ],
    });
    const paths = await domain.getPaths();
    expect(paths.length).toBe(1);
  });
});

it("upon translation failure, returns target output including the error", async () => {
  const error = new Error("some error");
  jest
    .spyOn(TemplateConfiguration.prototype, "translateWith")
    .mockImplementation(() => {
      return Promise.reject(error);
    });
  const domain = new Domain("example.com", {
    templates: [template],
  });
  const results = await domain.translate("/some/path");
  const result = results[0];
  expect(result.translation.outputs.length).toBe(0);
  expect(result.translation.error).toBe(error);
});
