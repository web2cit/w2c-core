import {
  // TemplateField,
  TemplateFieldDefinition,
} from "./templateField";
// import { Webpage } from '../webpage';
import { TranslationTemplate } from "./template";
import { Webpage } from "../webpage";
import { fetchSimpleCitation } from "../citoid";

// jest.mock('./templateField');
// const mockTemplateField = TemplateField as jest.MockedClass<typeof TemplateField>;

// jest.mock('../webpage');
// const mockWebpage = Webpage as jest.MockedClass<typeof Webpage>;

jest.mock("../citoid", () => {
  const originalModule = jest.requireActual("../citoid");
  return {
    ...originalModule,
    fetchSimpleCitation: jest.fn(),
  };
});
const mockFetchSimpleCitation = fetchSimpleCitation as jest.MockedFunction<
  typeof fetchSimpleCitation
>;

// beforeEach(() => {
//     mockTemplateField.mockClear();
//     mockWebpage.mockClear();
// })

const templateDomain = "https://example.com";
const templatePath = "/";
const fieldDef1: TemplateFieldDefinition = {
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
};
const fieldDef2: TemplateFieldDefinition = {
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
};

// it('calls the template field constructor', () => {
//     new TranslationTemplate(templateDomain, {
//         path: templatePath,
//         fields: [fieldDef1, fieldDef2]
//     });
//     expect(mockWebpage.mock.instances.length).toBe(1);
//     expect(mockWebpage.mock.calls[0]).toEqual([templateDomain + templatePath]);
//     expect(mockTemplateField.mock.instances.length).toBe(2);
//     expect(mockTemplateField.mock.calls[0]).toEqual([fieldDef1]);
//     expect(mockTemplateField.mock.calls[1]).toEqual([fieldDef2]);
// })

it("translates a target", () => {
  const template = new TranslationTemplate(templateDomain, {
    path: templatePath,
    fields: [fieldDef1, fieldDef2],
  });
  const target = new Webpage(templateDomain + "/article1");
  mockFetchSimpleCitation.mockResolvedValue({
    itemType: "webpage",
    title: "Sample title",
    url: "",
    tags: [],
  });
  return template.translate(target).then((output) => {
    expect(output.outputs.map((output) => output.output)).toEqual([
      ["webpage"],
      ["Sample title"],
    ]);
  });
});

it("rejects two or more unique fields with the same name", () => {
  const template = new TranslationTemplate(templateDomain, {
    path: templatePath,
    fields: [fieldDef1, Object.assign(fieldDef1)],
  });
  expect(template.fields.length).toBe(1);
});

it("refuse cross-domain translations", () => {
  const template = new TranslationTemplate(templateDomain, {
    path: templatePath,
    fields: [fieldDef1],
  });
  const target = new Webpage("https://sub.example.com/article1");
  return expect(template.translate(target)).rejects.toThrow("cannot translate");
});
