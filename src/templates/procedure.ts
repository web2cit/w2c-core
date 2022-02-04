import { Selection, SelectionDefinition } from "./selection";
import { Transformation, TransformationDefinition } from "./transformation";
import { TargetUrl } from "../targetUrl";
import { StepOutput } from "./step";

export class TranslationProcedure {
  selections: Array<Selection>;
  transformations: Array<Transformation>;

  constructor(
    procedure: TranslationProcedureDefinition = {
      selections: [],
      transformations: [],
    }
  ) {
    this.selections = procedure.selections.map((selection) =>
      Selection.create(selection)
    );
    this.transformations = procedure.transformations.map((transformation) =>
      Transformation.create(transformation)
    );
  }

  async translate(targetUrl: TargetUrl): Promise<ProcedureOutput> {
    const selections = await this.select(targetUrl);
    const selectionOutput = Array.prototype.concat(...selections);

    const transformations = await this.transform(selectionOutput);
    const transformationOutput = transformations.at(-1) ?? [];

    const procedureOutput = transformationOutput.length
      ? transformationOutput
      : selectionOutput;

    const output: ProcedureOutput = {
      targetUrl: targetUrl,
      procedure: this,
      output: {
        selection: selections,
        transformation: transformations,
        procedure: procedureOutput,
      },
    };
    return output;
  }

  select(targetUrl: TargetUrl): Promise<Array<StepOutput>> {
    // selection order should not matter
    return Promise.all(
      this.selections.map((selection) => {
        // todo: make sure I don't have trouble because of simultaneously refreshing the caches
        return selection.select(targetUrl);
      })
    );
  }

  async transform(input: StepOutput): Promise<Array<StepOutput>> {
    // transformation order does matter
    let currentInput: StepOutput = input;
    const outputs: Array<StepOutput> = [];
    for (const transformation of this.transformations) {
      const output = await transformation.transform(currentInput);
      outputs.push(output);
      currentInput = output;
    }
    return outputs;
  }
}

export interface ProcedureOutput {
  targetUrl: TargetUrl;
  procedure: TranslationProcedure;
  output: {
    selection: Array<StepOutput>;
    transformation: Array<StepOutput>;
    procedure: StepOutput;
  };
}

export interface TranslationProcedureDefinition {
  selections: Array<SelectionDefinition>;
  transformations: Array<TransformationDefinition>;
}
