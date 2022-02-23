import { Webpage } from "../webpage/webpage";
import { StepDefinition, StepOutput } from "../types";

export abstract class TranslationStep {
  abstract type: string;
  protected abstract _config: string;
  abstract get config(): TranslationStep["_config"];
  abstract set config(config: TranslationStep["_config"]);
  abstract apply(input: Webpage | StepOutput): Promise<StepOutput>;
  toJSON(): StepDefinition {
    return {
      type: this.type,
      config: this.config,
    };
  }
}
