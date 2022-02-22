import { FieldName } from "./translationField";

// fixme: remove dependencies below
import { Webpage } from "./webpage/webpage";
import { BaseTranslationTemplate } from "./templates/template";
import { TranslationProcedure } from "./templates/procedure";

/// Definitions

// Template definitions

export type TemplateConfiguration = TemplateDefinition[];

export type TemplateDefinition = {
  path: string;
  fields: TemplateFieldDefinition[];
  label?: string;
};

export type FallbackTemplateDefinition = Omit<TemplateDefinition, "path">;

export type TemplateFieldDefinition = {
  fieldname: FieldName;
  // fixme: change to procedures
  procedures: ProcedureDefinition[];
  required: boolean;
};

export type ProcedureDefinition = {
  selections: Array<SelectionDefinition>;
  transformations: Array<TransformationDefinition>;
};

export type StepDefinition = {
  type: string;
  config: string;
};

export type SelectionDefinition = StepDefinition;

export interface TransformationDefinition extends StepDefinition {
  itemwise: boolean;
}

// Pattern definitions

export type PatternConfiguration = PatternDefinition[];

export type PatternDefinition = {
  pattern: string;
  label?: string;
};

// Test definitions

// export type TestConfiguration = TestDefinition[];

// export type TestDefinition = {};

// Outputs

// Template outputs

export type TemplateOutput = {
  target: Webpage;
  outputs: Array<TemplateFieldOutput>;
  applicable: boolean;
  timestamp: string;
  template: BaseTranslationTemplate;
};

export type TemplateFieldOutput = {
  fieldname: FieldName;
  procedureOutputs: ProcedureOutput[];
  output: Array<string | null>; // todo: change Array<string>, see T302024
  valid: boolean; // todo: remove, see T302024
  required: boolean;
  applicable: boolean; // valid || !required
  control: boolean;
};

export type ProcedureOutput = {
  target: Webpage;
  procedure: TranslationProcedure;
  output: {
    selection: Array<StepOutput>;
    transformation: Array<StepOutput>;
    procedure: StepOutput;
  };
};

export type StepOutput = string[];
