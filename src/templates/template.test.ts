import { TemplateFieldDefinition } from "./templateField";
import { TranslationTemplate } from "./template";
import { Webpage } from "../webpage";
import * as nodeFetch from "node-fetch";
import { pages } from "../samplePages";

const mockNodeFetch = nodeFetch as typeof import("../../__mocks__/node-fetch");

const templateDomain = "https://example.com";
const templatePath = "/";
const fieldDefinitions: Array<TemplateFieldDefinition> = [
  {
    fieldname: "itemType",
    procedure: {
      selections: [
        {
          type: "citoid",
          value: "itemType",
        },
      ],
      transformations: [],
    },
    required: true,
  },
  {
    fieldname: "title",
    procedure: {
      selections: [
        {
          type: "citoid",
          value: "title",
        },
      ],
      transformations: [],
    },
    required: true,
  },
];

it("translates a target", () => {
  const template = new TranslationTemplate(templateDomain, {
    path: templatePath,
    fields: fieldDefinitions,
  });
  const targetUrl = templateDomain + "/article1";
  const target = new Webpage(targetUrl);
  mockNodeFetch.__addCitoidResponse(
    targetUrl,
    JSON.stringify(pages[targetUrl].citoid)
  );
  return template.translate(target).then((output) => {
    expect(output.outputs.map((output) => output.output)).toEqual([
      ["webpage"],
      ["Sample article"],
    ]);
  });
});

it("ignores multiple fields with the same name", () => {
  const template = new TranslationTemplate(templateDomain, {
    path: templatePath,
    fields: [
      fieldDefinitions[0],
      {
        ...fieldDefinitions[1],
        fieldname: fieldDefinitions[0].fieldname,
      },
    ],
  });
  expect(template.fields.length).toBe(1);
});

it("refuses cross-domain translations", () => {
  const template = new TranslationTemplate(templateDomain, {
    path: templatePath,
    fields: fieldDefinitions,
  });
  const target = new Webpage("https://sub.example.com/article1");
  return expect(template.translate(target)).rejects.toThrow("cannot translate");
});
