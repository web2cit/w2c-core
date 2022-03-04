import { TemplateConfiguration } from "./templateConfiguration";
import {
  FallbackTemplateDefinition,
  TemplateDefinition,
  TemplateOutput,
} from "../types";
import { Webpage } from "../webpage/webpage";
import * as nodeFetch from "node-fetch";
import { pages } from "../webpage/samplePages";

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
      procedures: [
        {
          selections: [
            {
              type: "citoid",
              config: "itemType",
            },
          ],
          transformations: [
            {
              // a split transformation should render the template non applicable
              // because the itemType field is not supposed to be an array
              type: "split",
              config: "",
              itemwise: true,
            },
          ],
        },
      ],
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
    },
  ],
};
const targetTemplate: TemplateDefinition = {
  path: targetPath,
  label: "target template",
  fields: [
    {
      fieldname: "authorLast",
      required: true,
      procedures: [
        {
          selections: [
            {
              type: "citoid",
              config: "authorLast",
            },
          ],
          transformations: [],
        },
      ],
    },
  ],
};

describe("Use an applicable template", () => {
  const templates = [nonApplicableTemplate, applicableTemplate];
  const paths = templates.map((template) => template.path);
  const configuration = new TemplateConfiguration(
    domain,
    [],
    undefined,
    templates
  );
  const target = new Webpage(targetUrl);

  beforeAll(() => {
    mockNodeFetch.__addCitoidResponse(
      targetUrl,
      JSON.stringify(pages[targetUrl].citoid)
    );
  });

  it("returns an applicable output", async () => {
    const output = (
      await configuration.translateWith(target, paths)
    )[0] as TemplateOutput;
    expect(output.applicable).toBe(true);
  });

  it("skips non-applicable templates", async () => {
    const output = (
      await configuration.translateWith(target, paths)
    )[0] as TemplateOutput;
    expect(output.template.label).toBe("second template");
  });

  it("outputs the expected results", async () => {
    const output = (
      await configuration.translateWith(target, paths)
    )[0] as TemplateOutput;
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

    await configuration.translateWith(target, paths);

    // the citoid cache's getData method should have been called twice
    // once for the citoid selection step in the first template, and
    // once for the citoid selection step in the second template
    expect(getDataSpy).toHaveBeenCalledTimes(2);
    // wheras the citoid cache's fetchData method and node-fetch
    // should have been called only once
    expect(fetchDataSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("prefers a template for the same path as the target", async () => {
    const configurationWithTargetTemplate = new TemplateConfiguration(
      domain,
      [],
      undefined,
      [...templates, targetTemplate]
    );
    const output = (
      await configurationWithTargetTemplate.translateWith(target, [
        ...paths,
        targetTemplate.path,
      ])
    )[0] as TemplateOutput;
    expect(output.template.label).toBe("target template");
  });
});

describe("Use the fallback template", () => {
  const templates = [nonApplicableTemplate];
  const paths = templates.map((template) => template.path);
  const fallbackDef: FallbackTemplateDefinition = {
    fields: [
      {
        fieldname: "authorFirst",
        procedures: [
          {
            selections: [
              {
                type: "citoid",
                config: "authorFirst",
              },
            ],
            transformations: [],
          },
        ],
        required: true,
      },
    ],
  };
  const configuration = new TemplateConfiguration(
    domain,
    [],
    fallbackDef,
    templates
  );
  const target = new Webpage(targetUrl);

  beforeAll(() => {
    mockNodeFetch.__addCitoidResponse(
      targetUrl,
      JSON.stringify(pages[targetUrl].citoid)
    );
  });

  it("refuses to use fallback template with path", () => {
    const fallbackDefWithPath = {
      ...fallbackDef,
      path: "/some-path",
    };
    expect(() => {
      new TemplateConfiguration(domain, [], fallbackDefWithPath, templates);
    }).toThrow("should not have template path");
  });

  it("returns an applicable output", async () => {
    const output = (
      await configuration.translateWith(target, paths)
    )[0] as TemplateOutput;
    expect(output.applicable).toBe(true);
  });

  it("outputs the expected results", async () => {
    const output = (
      await configuration.translateWith(target, paths)
    )[0] as TemplateOutput;
    expect(
      output.outputs.map((field) => [field.fieldname, field.output])
    ).toEqual([["authorFirst", ["John", "Jane"]]]);
  });
});

describe("No applicable templates", () => {
  const templates = [nonApplicableTemplate];
  const paths = templates.map((template) => template.path);
  const configuration = new TemplateConfiguration(
    domain,
    [],
    undefined,
    templates
  );
  const target = new Webpage(targetUrl);
  beforeAll(() => {
    mockNodeFetch.__addCitoidResponse(
      targetUrl,
      JSON.stringify(pages[targetUrl].citoid)
    );
  });

  it("translation returns false", () => {
    return expect(configuration.translateWith(target, paths)).resolves.toEqual(
      []
    );
  });
});

it("rejects multiple templates for the same path", () => {
  const duplicatePathTemplate: TemplateDefinition = {
    ...applicableTemplate,
  };
  const templates = [applicableTemplate, duplicatePathTemplate];
  expect(() => {
    new TemplateConfiguration(domain, [], undefined, templates);
  }).toThrow("Multiple templates provided");
});
