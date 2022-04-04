import { Selection } from "./selection";
import { Transformation } from "./transformation";
import { Webpage } from "../webpage/webpage";
import { StepOutput } from "../types";
import { ProcedureDefinition, ProcedureOutput } from "../types";
import log from "loglevel";

export class TranslationProcedure {
  selections: Array<Selection>;
  transformations: Array<Transformation>;

  constructor(
    procedure: ProcedureDefinition = {
      selections: [],
      transformations: [],
    },
    {
      strict = true,
    }: {
      strict?: boolean;
    } = {}
  ) {
    this.selections = procedure.selections.reduce(
      (selections: Selection[], selection) => {
        try {
          selections.push(Selection.create(selection));
        } catch (e) {
          if (!strict) {
            const type = selection.type ?? "untitled";
            log.warn(
              `Failed to parse "${type}" selection step definition: ${e}`
            );
          } else {
            throw e;
          }
        }
        return selections;
      },
      []
    );
    this.transformations = procedure.transformations.reduce(
      (transformations: Transformation[], transformation) => {
        try {
          transformations.push(Transformation.create(transformation));
        } catch (e) {
          if (!strict) {
            const type = transformation.type ?? "untitled";
            log.warn(
              `Failed to parse "${type}" transformation step definition: ${e}`
            );
          } else {
            throw e;
          }
        }
        return transformations;
      },
      []
    );
  }

  async translate(target: Webpage): Promise<ProcedureOutput> {
    const selections = await this.select(target);
    const selectionOutput = Array.prototype.concat(...selections);

    const transformations = await this.transform(selectionOutput);
    const transformationOutput = transformations.slice(-1).pop() ?? [];

    const procedureOutput = transformations.length
      ? transformationOutput
      : selectionOutput;

    const output: ProcedureOutput = {
      target,
      procedure: this,
      output: {
        selection: selections,
        transformation: transformations,
        procedure: procedureOutput,
      },
    };
    return output;
  }

  select(target: Webpage): Promise<Array<StepOutput>> {
    // selection order should not matter
    return Promise.all(
      this.selections.map((selection) => {
        // todo: make sure I don't have trouble because of simultaneously refreshing the caches
        return selection.select(target);
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

  toJSON(): ProcedureDefinition {
    return {
      selections: this.selections.map((selection) => selection.toJSON()),
      transformations: this.transformations.map((transformation) =>
        transformation.toJSON()
      ),
    };
  }
}
