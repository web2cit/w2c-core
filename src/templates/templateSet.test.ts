import { TemplateSet } from "./templateSet";
import {
  TemplateDefinition,
  TranslationTemplate,
  TemplateOutput,
} from "./template";
import { Webpage } from "../webpage";
import * as nodeFetch from "node-fetch";
import { pages } from "../samplePages";

const mockNodeFetch = nodeFetch as typeof import("../../__mocks__/node-fetch");

const domain = "example.com";
const targetPath = "/article1";
const targetUrl = "https://" + domain + targetPath;
const nonApplicableTemplate: TemplateDefinition = {
  path: "/template1",
  label: "first template",
  fields: [
    {
      fieldname: "itemType",
      required: true, // confirm what happens if I say false for a forceRequired field?
      procedure: {
        selections: [
          {
            type: "citoid",
            value: "itemType",
          },
        ],
        transformations: [
          {
            // a split transformation should render the template non applicable
            // because the itemType field is not supposed to be an array
            type: "split",
            value: "",
            itemwise: true,
          },
        ],
      },
    },
  ],
};
const applicableTemplate: TemplateDefinition = {
  path: "/template2",
  label: "second template",
  fields: [
    {
      fieldname: "title",
      required: true,
      procedure: {
        selections: [
          {
            type: "citoid",
            value: "title",
          },
        ],
        transformations: [],
      },
    },
  ],
};

describe("Use an applicable template", () => {
  const templates = [nonApplicableTemplate, applicableTemplate];
  const templateSet = new TemplateSet(domain, templates);
  const target = new Webpage(targetUrl);

  beforeAll(() => {
    mockNodeFetch.__addCitoidResponse(
      targetUrl,
      JSON.stringify(pages[targetUrl].citoid)
    );
  });

  it("returns an applicable output", async () => {
    const output = (await templateSet.translate(target)) as TemplateOutput;
    expect(output.applicable).toBe(true);
  });

  it("skips non-applicable templates", async () => {
    const output = (await templateSet.translate(target)) as TemplateOutput;
    expect(output.template.label).toBe("second template");
  });

  it("outputs the expected results", async () => {
    const output = (await templateSet.translate(target)) as TemplateOutput;
    expect(
      output.outputs.map((field) => [field.fieldname, field.output])
    ).toEqual([["title", ["Sample article"]]]);
  });
});

// describe("Use the fallback template", () => {});
// describe("No applicable templates", () => {});
