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
      required: true,
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

  it("fetches the target only once", async () => {
    // create new target and spy on its citoid cache's getData and fetchData methods
    const target = new Webpage(targetUrl);
    const getDataSpy = jest.spyOn(target.cache.citoid, "getData");
    const fetchDataSpy = jest.spyOn(target.cache.citoid, "fetchData");

    const fetchSpy = jest.spyOn(mockNodeFetch, "default");

    await templateSet.translate(target);

    // the citoid cache's getData method should have been called twice
    // once for the citoid selection step in the first template, and
    // once for the citoid selection step in the second template
    expect(getDataSpy).toHaveBeenCalledTimes(2);
    // wheras the citoid cache's fetchData method and node-fetch
    // should have been called only once
    expect(fetchDataSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});

// describe("No applicable templates", () => {});
