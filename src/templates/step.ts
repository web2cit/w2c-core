import { TargetUrl } from "../targetUrl";

export abstract class TranslationStep {
  abstract type: string;
  protected abstract _config: string;
  abstract get config(): TranslationStep["_config"];
  abstract set config(config: TranslationStep["_config"]);
  abstract apply(input: TargetUrl | StepOutput): Promise<StepOutput>;
}

export type StepOutput = Array<string>;