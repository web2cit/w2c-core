import { TemplateField } from "./templateField";
import { TranslationTemplate } from "./template";
import { Webpage } from "../webpage/webpage";
import * as nodeFetch from "node-fetch";
import { pages } from "../webpage/samplePages";
import { TemplateFieldDefinition, TemplateDefinition } from "../types";
import log from "loglevel";

const mockNodeFetch = nodeFetch as typeof import("../../__mocks__/node-fetch");

const templateDomain = "example.com";
const templatePath = "/";
const fieldDefinitions: Array<TemplateFieldDefinition> = [
  {
    fieldname: "itemType",
    procedures: [
      {
        selections: [
          {
            type: "citoid",
            config: "itemType",
          },
        ],
        transformations: [],
      },
    ],
    required: true,
  },
  {
    fieldname: "title",
    procedures: [
      {
        selections: [
          {
            type: "citoid",
            config: "title",
          },
        ],
        transformations: [],
      },
    ],
    required: true,
  },
];

it("translates a target", () => {
  const template = new TranslationTemplate(templateDomain, {
    path: templatePath,
    fields: fieldDefinitions,
  });
  const targetUrl = "https://example.com/article1";
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

it("outputs a JSON template definition", () => {
  const template = new TranslationTemplate("example.com", {
    path: "/article1",
    fields: [],
  });
  template.label = "sample label";
  template.addField(new TemplateField("itemType", { loadDefaults: true }));
  expect(template.toJSON()).toEqual<TemplateDefinition>({
    path: "/article1",
    label: "sample label",
    fields: [
      {
        fieldname: "itemType",
        procedures: [
          {
            selections: [
              {
                type: "citoid",
                config: "itemType",
              },
            ],
            transformations: [],
          },
        ],
        required: true,
      },
    ],
  });
});

it("constructor optionally skips invalid field definitions", () => {
  const warnSpy = jest.spyOn(log, "warn").mockImplementation();
  const definition: unknown = {
    path: "/",
    fields: [
      {
        fieldname: "itemType",
        required: true,
        procedures: [],
      },
      {
        fieldname: "invalidField",
        required: true,
        procedures: [],
      },
    ],
  };
  const template = new TranslationTemplate(
    "example.com",
    definition as TemplateDefinition,
    { strict: false }
  );
  expect(warnSpy).toHaveBeenCalledTimes(1);
  expect(template.toJSON()).toEqual({
    path: "/",
    label: "",
    fields: [
      {
        fieldname: "itemType",
        required: true,
        procedures: [],
      },
    ],
  });
  expect(() => {
    new TranslationTemplate("example.com", definition as TemplateDefinition);
  }).toThrow();
});

it("rejects creation if a mandatory field is missing", () => {
  const definition: TemplateDefinition = {
    path: "/",
    fields: [
      {
        fieldname: "title",
        required: true,
        procedures: [],
      },
    ],
  };
  expect(() => {
    new TranslationTemplate("example.com", definition, {
      forceRequiredFields: ["itemType", "title"],
    });
  }).toThrow('Mandatory field "itemType" missing from template definition');
});
