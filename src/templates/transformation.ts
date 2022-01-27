// todo: use smaller sugar-date (seems to have trouble with typescript)
import { Date } from "sugar";
import "sugar/locales";

abstract class Transformation {
  readonly type: TransformationType;
  itemwise: boolean;
  protected _config = "";
  abstract transform(input: Array<string>): Array<string>;
  constructor(
    type: Transformation["type"],
    itemwise: Transformation["itemwise"]
  ) {
    this.type = type;
    this.itemwise = itemwise;
  }

  get config(): Transformation["_config"] {
    return this._config;
  }

  set config(config: Transformation["_config"]) {
    this._config = config;
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

  transform(input: Array<string>): Array<string> {
    let output: Array<string>;
    if (this.itemwise) {
      output = input.map((item) => {
        return item.split("").join(this.config);
      });
    } else {
      output = [input.join(this.config)];
    }
    return output;
  }
}

export class SplitTransformation extends Transformation {
  constructor(itemwise = true, separator = ",") {
    super("split", itemwise);
    this.config = separator;
  }

  transform(input: Array<string>): Array<string> {
    if (!this.itemwise) {
      input = [input.join()];
    }
    return input.reduce((output: Array<string>, item) => {
      output = output.concat(item.split(this.config));
      return output;
    }, []);
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
  transform(input: Array<string>): Array<string> {
    if (!this.itemwise) {
      input = [input.join()];
    }
    return input.map((item) => {
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
  private ranges: Array<{
    start: number;
    end: number | undefined;
  }> = [];
  constructor(itemwise = false, range = "0:") {
    super("range", itemwise);
    this.config = range;
  }

  set config(config: string) {
    const ranges = config.replace(/\s/g, "").split(",");
    if (ranges.every((range) => /^\d+(:(\d+)?)?|:\d+$/.test(range))) {
      this._config = ranges.join(",");
    } else {
      throw new TransformationConfigTypeError(this.type, config);
    }
  }

  transform(input: Array<string>): Array<string> {
    let arrayedInput: Array<typeof input>;
    if (this.itemwise) {
      arrayedInput = input.map((item) => [item]);
    } else {
      arrayedInput = [input];
    }
    return arrayedInput.reduce((item: Array<string>, output: Array<string>) => {
      this.ranges.forEach((range) => {
        output = output.concat(
          item.slice(range.start, range.end ? range.end + 1 : undefined)
        );
      });
      return output;
    }, []);
  }
}

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
