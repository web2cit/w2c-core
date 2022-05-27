import { FieldName, isFieldName } from "./translationField";

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

export function isTemplateDefinition(
  definition: unknown
): definition is TemplateDefinition {
  const { path, fields, label } = definition as TemplateDefinition;
  if (
    path !== undefined &&
    typeof path === "string" &&
    (label === undefined || typeof label === "string") &&
    fields !== undefined &&
    Array.isArray(fields) &&
    fields.every((field) => isTemplateFieldDefinition(field))
  ) {
    return true;
  } else {
    return false;
  }
}

export type FallbackTemplateDefinition = Omit<TemplateDefinition, "path">;

export type TemplateFieldDefinition = {
  fieldname: FieldName;
  procedures: ProcedureDefinition[];
  required: boolean;
};

export function isTemplateFieldDefinition(
  definition: unknown
): definition is TemplateFieldDefinition {
  const { fieldname, procedures, required } =
    definition as TemplateFieldDefinition;
  if (
    fieldname !== undefined &&
    isFieldName(fieldname) &&
    required !== undefined &&
    typeof required === "boolean" &&
    procedures !== undefined &&
    Array.isArray(procedures) &&
    procedures.every((procedure) => isProcedureDefinition(procedure))
  ) {
    return true;
  } else {
    return false;
  }
}

export type ProcedureDefinition = {
  selections: Array<SelectionDefinition>;
  transformations: Array<TransformationDefinition>;
};

export function isProcedureDefinition(
  definition: unknown
): definition is ProcedureDefinition {
  const { selections, transformations } = definition as ProcedureDefinition;
  if (
    selections !== undefined &&
    Array.isArray(selections) &&
    selections.every((selection) => isSelectionDefinition(selection)) &&
    transformations !== undefined &&
    Array.isArray(transformations) &&
    transformations.every((transformation) =>
      isTransformationDefinition(transformation)
    )
  ) {
    return true;
  } else {
    return false;
  }
}

export type StepDefinition = {
  type: string;
  config: string;
};

export type SelectionDefinition = StepDefinition;

export function isSelectionDefinition(
  definition: unknown
): definition is SelectionDefinition {
  const { type, config } = definition as SelectionDefinition;
  if (
    type !== undefined &&
    typeof type === "string" &&
    config !== undefined &&
    typeof config === "string"
  ) {
    return true;
  } else {
    return false;
  }
}

export interface TransformationDefinition extends StepDefinition {
  itemwise: boolean;
}

export function isTransformationDefinition(
  definition: unknown
): definition is TransformationDefinition {
  const { type, config, itemwise } = definition as TransformationDefinition;
  if (
    type !== undefined &&
    typeof type === "string" &&
    config !== undefined &&
    typeof config === "string" &&
    itemwise !== undefined &&
    typeof itemwise === "boolean"
  ) {
    return true;
  } else {
    return false;
  }
}

// Pattern definitions

export type PatternConfiguration = PatternDefinition[];

export type PatternDefinition = {
  pattern: string;
  label?: string;
};

export function isPatternDefinition(
  definition: unknown
): definition is PatternDefinition {
  const { pattern, label } = definition as PatternDefinition;
  if (
    pattern !== undefined &&
    typeof pattern === "string" &&
    (label === undefined || typeof label === "string")
  ) {
    return true;
  } else {
    return false;
  }
}

// Test definitions

export type TestConfiguration = TestDefinition[];

export type TestDefinition = {
  path: string;
  fields: TestFieldDefinition[];
};

export function isTestDefinition(
  definition: unknown
): definition is TestDefinition {
  const { path, fields } = definition as TestDefinition;
  if (
    path !== undefined &&
    typeof path === "string" &&
    fields !== undefined &&
    Array.isArray(fields) &&
    fields.every((field) => isTestFieldDefinition(field))
  ) {
    return true;
  } else {
    return false;
  }
}

export type TestFieldDefinition = {
  fieldname: FieldName;
  goal: StepOutput;
};

function isTestFieldDefinition(
  definition: unknown
): definition is TestFieldDefinition {
  const { fieldname, goal } = definition as TestFieldDefinition;
  if (
    fieldname !== undefined &&
    isFieldName(fieldname) &&
    goal !== undefined &&
    Array.isArray(goal) &&
    goal.every((value) => typeof value === "string")
  ) {
    return true;
  } else {
    return false;
  }
}

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
  output: StepOutput;
  valid: boolean;
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

// Test outputs
export type TestOutput = {
  fields: TestFieldOutput[];
};

type TestFieldOutput = {
  fieldname: FieldName;
  score: number;
};
