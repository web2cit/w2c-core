import { Webpage } from "../webpage/webpage";
import { Domain } from "./domain";

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
      {
        path: "/template1",
        label: "applicable",
        fields: [
          {
            fieldname: "itemType",
            required: true,
            procedures: [
              {
                selections: [{ type: "fixed", config: "webpage" }],
                transformations: [],
              },
            ],
          },
          {
            fieldname: "title",
            required: true,
            procedures: [
              {
                selections: [{ type: "fixed", config: "title" }],
                transformations: [],
              },
            ],
          },
        ],
      },
    ],
  });
  const target = new Webpage("https://example.com/target");
  const translationOutput = await domain.translate(target, {
    onlyApplicable: false,
  });
  const templateOutputs = translationOutput.translation.outputs;
  expect(templateOutputs.length).toBe(2);
  expect(templateOutputs[0].template.applicable).toBe(false);
  expect(templateOutputs[0].citation).toBeUndefined();
  expect(templateOutputs[1].template.applicable).toBe(true);
  expect(templateOutputs[1].citation).toBeDefined();
});
