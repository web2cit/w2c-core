// todo: use smaller sugar-date (seems to have trouble with typescript)
import { TranslationStep, StepOutput, StepDefinition } from "./step";
import { Date } from "sugar";
import "sugar/locales";

export abstract class Transformation extends TranslationStep {
  readonly type: TransformationType;
  itemwise: boolean;
  protected _config = "";
  apply = this.transform;
  abstract transform(input: StepOutput): Promise<StepOutput>;
  constructor(
    type: Transformation["type"],
    itemwise: Transformation["itemwise"]
  ) {
    super();
    this.type = type;
    this.itemwise = itemwise;
  }

  get config(): Transformation["_config"] {
    return this._config;
  }

  set config(config: Transformation["_config"]) {
    this._config = config;
  }

  static create(transformation: TransformationDefinition) {
    const itemwise = transformation.itemwise;
    const value = transformation.value;
    switch (transformation.type) {
      case "join":
        return new JoinTransformation(itemwise, value);
        break;
      case "split":
        return new SplitTransformation(itemwise, value);
        break;
      case "date":
        // asume value is DateConfig and let DateTransformation fail otherwise
        return new DateTransformation(itemwise, value as DateConfig);
        break;
      case "range":
        return new RangeTransformation(itemwise, value);
        break;
      default:
        throw new Error(
          `Unknown transformation of type ${transformation.type}`
        );
    }
  }

  toJSON(): TransformationDefinition {
    return {
      ...super.toJSON(),
      itemwise: this.itemwise,
    };
  }
}

const TRANSFORMATION_TYPES = [
  "join",
  "split",
  "date",
  "range",
  "match",
  "replace",
  "custom", // custom javascript
] as const;
type TransformationType = typeof TRANSFORMATION_TYPES[number];

export class JoinTransformation extends Transformation {
  constructor(itemwise = false, separator = ",") {
    super("join", itemwise);
    this.config = separator;
  }

  transform(input: StepOutput): Promise<StepOutput> {
    let output: StepOutput;
    if (this.itemwise) {
      output = input.map((item) => {
        return item.split("").join(this.config);
      });
    } else {
      output = [input.join(this.config)];
    }
    return Promise.resolve(output);
  }
}

export class SplitTransformation extends Transformation {
  constructor(itemwise = true, separator = ",") {
    super("split", itemwise);
    this.config = separator;
  }

  transform(input: StepOutput): Promise<StepOutput> {
    if (!this.itemwise) {
      input = [input.join()];
    }
    const output = input.reduce((accumulator: StepOutput, item) => {
      accumulator = accumulator.concat(item.split(this.config));
      return accumulator;
    }, []);
    return Promise.resolve(output);
  }
}

/** Parse date transformation step class */
export class DateTransformation extends Transformation {
  protected _config: DateConfig = "en";
  constructor(itemwise = true, locale: DateConfig = "en") {
    super("date", itemwise);
    this.config = locale;
  }

  set config(config: string) {
    if (isDateConfig(config)) {
      try {
        Date.setLocale(config);
      } catch {
        throw new TransformationConfigTypeError(this.type, config);
      }
      this._config = config;
    } else {
      throw new TransformationConfigTypeError(this.type, config);
    }
  }

  // if setter is redefined, getter must be redefined too
  // https://stackoverflow.com/questions/28950760/override-a-setter-and-the-getter-must-also-be-overridden
  get config(): DateTransformation["_config"] {
    return this._config;
  }

  /**
   * Tries to convert a free-form string into yyyy(/mm(/dd)) format
   * @param { string } input - A free-form string
   * @returns { string } A yyyy/mm/dd date string
   */
  transform(input: StepOutput): Promise<StepOutput> {
    if (!this.itemwise) {
      input = [input.join()];
    }
    const output = input.map((item) => {
      // todo: add custom transformations resembling those in Citoid API
      // partialISO and journalFormat
      // consider having a class property with the Date object
      // see custom parsing formats https://sugarjs.com/docs/#date-parsing
      const date = Date.create(item, {
        locale: this.config, // does not fail if invalid locale given
        fromUTC: true,
      });
      if (isNaN(date.getTime())) {
        // if unable to parse date, return unchanged
        return item;
      } else {
        return date.toISOString().substring(0, 10);
      }
    });
    return Promise.resolve(output);
  }
}
const DATE_CONFIGS = [
  // Locales supported by Sugar
  // Custom locales may be added https://sugarjs.com/docs/#date-locales
  "ca",
  "da",
  "de",
  "en",
  "es",
  "fi",
  "fr",
  "it",
  "ja",
  "ko",
  "nl",
  "no",
  "pl",
  "pt",
  "ru",
  "sv",
  "zh-CN",
  "zh-TW",
] as const;
type DateConfig = typeof DATE_CONFIGS[number];
function isDateConfig(config: string): config is DateConfig {
  return DATE_CONFIGS.includes(config as DateConfig);
}

export class RangeTransformation extends Transformation {
  constructor(itemwise = false, range = "0:") {
    super("range", itemwise);
    this.config = range;
  }

  set config(config: string) {
    let ranges = config.replace(/\s/g, "").split(",");
    // ignore empty ranges, i.e., successive commas
    ranges = ranges.filter((range) => range);
    if (ranges.every((range) => /^(\d+(:(\d+)?)?|:\d+)$/.test(range))) {
      this._config = ranges.join(",");
    } else {
      throw new TransformationConfigTypeError(this.type, config);
    }
  }

  get config() {
    return this._config;
  }

  transform(input: StepOutput): Promise<StepOutput> {
    let arrayedInput: Array<typeof input>;
    if (this.itemwise) {
      arrayedInput = input.map((item) => [item]);
    } else {
      arrayedInput = [input];
    }
    const output = arrayedInput.reduce(
      (accumulator: StepOutput, item: Array<string>) => {
        this.ranges.forEach((range) => {
          const start = range.start;
          const end = range.end === undefined ? item.length - 1 : range.end;
          accumulator = accumulator.concat(item.slice(start, end + 1));
        });
        return accumulator;
      },
      []
    );
    return Promise.resolve(output);
  }

  private get ranges(): Array<Range> {
    if (!this.config) return [];
    const ranges: Array<Range> = this.config
      .split(",")
      .reduce((ranges: Array<Range>, rangeString: string) => {
        const [start, end] = rangeString.split(":");
        const range: Range = {
          // see https://github.com/microsoft/TypeScript/issues/41638
          start: start === "" ? 0 : parseInt(start as string),
        };
        if (end === undefined) {
          range.end = range.start;
        } else if (end !== "") {
          range.end = parseInt(end);
        }
        ranges.push(range);
        return ranges;
      }, []);
    return ranges;
  }
}
type Range = {
  start: number;
  end?: number;
};

/** Regular expression transformation step class. */
// class MatchTransformation extends Transformation {}

// class ReplaceTransformation extends Transformation {}

/** Custom JavaScript transformation step class. */
// class CustomTransformation {
//   /**
//    * Create a Custom JavaScript transformation step.
//    * @param {}
//    */
//   constructor();
// }

export class TransformationConfigTypeError extends TypeError {
  constructor(transformationType: TransformationType, config: string) {
    super(
      `"${config}" is not a valid configuration value for tranformation type "${transformationType}"`
    );
  }
}

export interface TransformationDefinition extends StepDefinition {
  itemwise: boolean;
}
