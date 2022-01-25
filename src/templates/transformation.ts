// todo: use smaller sugar-date (seems to have trouble with typescript)
import sugar, { Date } from 'sugar';

abstract class Transformation {
    type: TransformationType | undefined;
    inputType;  // should transformation steps force input transformation?
    outputType;
    itemwise: boolean;  // whether transformation should be applied item-wise
    itemwiseable: boolean; // ?
    protected _config = "";
    abstract get config(): Transformation['_config'];
    abstract set config(config: string);
    abstract transform(input: Array<string>): Array<string>  // OutputValue

}

TRANSFORMATION_TYPES = [
    ''
    ''
    'custom'  // custom javascript
] as const;
type TransformationType = typeof TRANSFORMATION_TYPES[number];

interface TransformationOutput {

}

class JoinTransformation extends Transformation {
    transform(input: Array<string>): Array<string> {
        let output: Array<string>;
        if (this.itemwise) {
            output = input.map((item) => {
                return item.split("").join(this.config);
            })
        } else {
            output = [input.join(this.config)];
        }
        return output;
    }
}

class SplitTransformation extends Transformation {
    Date.
    transform(input: Array<string>): Array<string> {
        if (!this.itemwise) {
            input = [input.join()];
        }
        return input.reduce(
            (output: Array<string>, item) => {
                output = output.concat(item.split(this.config))
                return output;
            }, []
        )
    }
}

/** Parse date transformation step class */
class ParseDateTransformation extends Transformation {
    // Citoid API uses v1 of the Chrono library
    // It supports 8 languages (v2 supports 7)
    // The Sugar library supports 17 locales

    set config(config) {
        // Make sure it is one of the locales supported by Sugar
        // ca, da, de, es, fi, fr, it, ja, ko, nl, no, pl, pt, ru, sv, zh-CN, zh-TW
        // We may add extra locales https://sugarjs.com/docs/#date-locales
        this._config = config;
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
            return Date.create(
                item,
                { 
                    locale: this.config,
                    fromUTC: true
                }
            ).toISOString().substring(0, 10);
        });
    }
}

class RangeTransformation extends Transformation {
    config: // ["cero", "uno", "dos", "tres", "cuatro"] "0,0:3,1:,:2" => ["cero", "cero", "uno", "dos", "tres", "uno", "dos", "tres", "cuatro", "cero", "uno", "dos"]
}

/** Regular expression transformation step class. */
class MatchTransformation extends Transformation {

}

class ReplaceTransformation extends Transformation {

}

/** Custom JavaScript transformation step class. */
class CustomTransformation {
    /**
     * Create a Custom JavaScript transformation step.
     * @param {}
     */
    constructor()

}