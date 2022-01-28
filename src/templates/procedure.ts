import { Selection } from "./selection";
import { Transformation } from "./transformation";
import { TargetUrl } from "../targetUrl";
import { StepOutput } from "./step";

export class TranslationProcedure {
  selections: Array<Selection>;
  transformations: Array<Transformation>;

  constructor(
    selections: Array<Selection> = [],
    transformations: Array<Transformation> = []
  ) {
    this.selections = selections;
    this.transformations = transformations;
  }

  async translate(targetUrl: TargetUrl): Promise<ProcedureOutput> {
    const selections = await this.select(targetUrl);
    const selectionOutput = Array.prototype.concat(...selections);
    const transformations = await this.transform(selectionOutput);
    const transformationOutput = transformations.at(-1) ?? [];
    const output: ProcedureOutput = {
      targetUrl: targetUrl,
      procedure: this,
      output: {
        selection: selections,
        transformation: transformations,
        procedure: transformationOutput,
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

interface ProcedureOutput {
  targetUrl: TargetUrl;
  procedure: TranslationProcedure;
  output: {
    selection: Array<StepOutput>;
    transformation: Array<StepOutput>;
    procedure: StepOutput;
  };
}
