import { TemplateConfiguration } from "./templateConfiguration";
import {
  FallbackTemplateDefinition,
  TemplateDefinition,
  TemplateOutput,
} from "../types";
import { Webpage } from "../webpage/webpage";
import * as nodeFetch from "node-fetch";
import { pages } from "../webpage/samplePages";
import log from "loglevel";
import { ContentRevision } from "../mediawiki/revisions";

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

  it("skips non-applicable templates by default", async () => {
    const output = (
      await configuration.translateWith(target, paths)
    )[0] as TemplateOutput;
    expect(output.template.label).toBe("second template");
  });

  it("optionally returns non-applicable template outputs", async () => {
    const outputs = (await configuration.translateWith(target, paths, {
      onlyApplicable: false,
    })) as TemplateOutput[];
    expect(outputs.length).toBe(2);
    expect(outputs[0].applicable).toBe(false);
    expect(outputs[1].applicable).toBe(true);
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

it("multiple templates for the same path are silently ignored", () => {
  const duplicatePathTemplate: TemplateDefinition = {
    ...applicableTemplate,
  };
  const templates = [applicableTemplate, duplicatePathTemplate];
  const configuration = new TemplateConfiguration(
    domain,
    [],
    undefined,
    templates
  );
  expect(configuration.get().length).toBe(1);
});

describe("Configuration revisions", () => {
  const warnSpy = jest.spyOn(log, "warn").mockImplementation();
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("skips misformatted elements individually", () => {
    const content = JSON.stringify([
      {
        path: "/",
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
                  {
                    type: "invalidType",
                    config: "itemType",
                  },
                ],
                transformations: [
                  {
                    type: "range",
                    config: "1",
                    itemwise: true,
                  },
                  {
                    type: "range",
                    config: "invalidConfig",
                    itemwise: true,
                  },
                ],
              },
              {
                selections: [],
              },
              {
                transformations: [],
              },
            ],
          },
          {
            fieldname: "invalidField",
            required: true,
            procedures: [],
          },
        ],
      },
    ]);
    const revision: ContentRevision = {
      revid: 0,
      timestamp: "",
      content,
    };
    const configuration = new TemplateConfiguration(
      "example.com",
      [],
      undefined
    );
    configuration.loadRevision(revision);
    expect(warnSpy).toHaveBeenCalledTimes(5);
    expect(configuration.get().map((template) => template.toJSON())).toEqual([
      {
        path: "/",
        label: "",
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
                    type: "range",
                    config: "1",
                    itemwise: true,
                  },
                ],
              },
            ],
          },
        ],
      },
    ]);
  });
  it("skips templates with missing mandatory fields", () => {
    const definitions: TemplateDefinition[] = [
      {
        path: "/",
        fields: [
          {
            fieldname: "itemType",
            required: true,
            procedures: [],
          },
        ],
      },
    ];
    const revision: ContentRevision = {
      revid: 0,
      timestamp: "",
      content: JSON.stringify(definitions),
    };
    const configuration = new TemplateConfiguration(
      "example.com",
      ["itemType", "title"],
      undefined
    );
    configuration.loadRevision(revision);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(configuration.get().length).toBe(0);
  });
});

describe("Configuration object to JSON", () => {
  it("returns json from configuration initialized with templates", () => {
    const templates = [applicableTemplate];
    const configuration = new TemplateConfiguration(
      domain,
      [],
      undefined,
      templates
    );
    expect(configuration.toJSON()).toEqual(templates);
  });

  it("returns json from configuration with templates added", () => {
    const configuration = new TemplateConfiguration(domain, [], undefined);
    configuration.add(applicableTemplate);
    expect(configuration.toJSON()).toEqual([applicableTemplate]);
  });
});

describe("Getting templates", () => {
  const template: TemplateDefinition = {
    path: "/path/to/template",
    fields: [],
  };
  const configuration = new TemplateConfiguration(domain, [], undefined, [
    template,
  ]);

  it("url-normalizes path before getting matching template", () => {
    const templates = configuration.get("/path/./to/../to/template");
    expect(templates[0].path).toBe("/path/to/template");
  });
});

describe("Template manipulation", () => {
  const template1: TemplateDefinition = {
    path: "/path/to/template/1",
    fields: [],
  };
  const template2: TemplateDefinition = {
    path: "/path/to/template/2",
    fields: [],
  };

  let configuration: TemplateConfiguration;
  beforeEach(() => {
    configuration = new TemplateConfiguration(domain, [], undefined, [
      template1,
      template2,
    ]);
  });

  it("url-normalizes path before moving a template", () => {
    configuration.move("/path/./to/../to/template/1", 1);
    const templates = configuration.get();
    expect(
      templates.findIndex((template) => template.path === "/path/to/template/1")
    ).toBe(1);
  });

  it("url-normalizes path before removing a template", () => {
    configuration.remove("/path/./to/../to/template/1");
    const templates = configuration.get();
    expect(templates.length).toBe(1);
  });
});
