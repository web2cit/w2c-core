import {
  DateTransformation,
  JoinTransformation,
  RangeTransformation,
  SplitTransformation,
  MatchTransformation,
  TransformationConfigTypeError,
} from "./transformation";

describe("Join tranformation", () => {
  const input = ["an", "array", "of", "strings"];
  it("joins input with default settings", async () => {
    const transformation = new JoinTransformation();
    const output = transformation.transform(input);
    expect(await output).toEqual(["an,array,of,strings"]);
  });
  it("joins input itemwise", async () => {
    const transformation = new JoinTransformation(true);
    const output = transformation.transform(input);
    expect(await output).toEqual(["a,n", "a,r,r,a,y", "o,f", "s,t,r,i,n,g,s"]);
  });
  it("joins input with custom separator", async () => {
    const transformation = new JoinTransformation(undefined, "|");
    const output = transformation.transform(input);
    expect(await output).toEqual(["an|array|of|strings"]);
  });
  it("json-stringifies to transformation definition", () => {
    const transformation = new JoinTransformation(true, " - ");
    expect(JSON.stringify(transformation)).toEqual(
      JSON.stringify({
        type: "join",
        config: " - ",
        itemwise: true,
      })
    );
  });
});

describe("Split transformation", () => {
  it("splits a single-string input", () => {
    const transformation = new SplitTransformation(false, "");
    return expect(transformation.transform(["string"])).resolves.toEqual([
      "s",
      "t",
      "r",
      "i",
      "n",
      "g",
    ]);
  });
  it("splits a single-string input, itemwise", () => {
    const transformation = new SplitTransformation(true, "");
    return expect(transformation.transform(["string"])).resolves.toEqual([
      "s",
      "t",
      "r",
      "i",
      "n",
      "g",
    ]);
  });
  it("splits a multiple-string input", () => {
    const transformation = new SplitTransformation(false, "");
    return expect(transformation.transform(["one", "two"])).resolves.toEqual([
      "o",
      "n",
      "e",
      ",",
      "t",
      "w",
      "o",
    ]);
  });
  it("splits a multiple-string input, itemwise", () => {
    const transformation = new SplitTransformation(true, "");
    return expect(transformation.transform(["one", "two"])).resolves.toEqual([
      "o",
      "n",
      "e",
      "t",
      "w",
      "o",
    ]);
  });
});

describe("Date transformation", () => {
  it("parses English dates", async () => {
    const transformation = new DateTransformation();
    expect(await transformation.transform(["January 27, 2022"])).toEqual([
      "2022-01-27",
    ]);
    expect(await transformation.transform(["yesterday"])).toEqual([
      new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    ]);
  });
  it("parses Spanish dates", async () => {
    const transformation = new DateTransformation(undefined, "es");
    expect(await transformation.transform(["27 de enero de 2022"])).toEqual([
      "2022-01-27",
    ]);
    expect(await transformation.transform(["ayer"])).toEqual([
      new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    ]);
  });
  it("rejects unsupported locales", () => {
    expect(() => new DateTransformation(undefined, "xx" as never)).toThrow(
      TransformationConfigTypeError
    );
  });
  it("ignores unknown dates", async () => {
    const transformation = new DateTransformation();
    expect(await transformation.transform(["not a date"])).toEqual([
      "not a date",
    ]);
  });
  it("parses dates without a day", async () => {
    const transformation = new DateTransformation();
    expect(await transformation.transform(["January 2022"])).toEqual([
      "2022-01",
    ]);
  });
});

describe("Range transformation", () => {
  const input = ["zero", "one", "two", "three"];
  it("selects single item", async () => {
    const transformation = new RangeTransformation();
    transformation.config = "1";
    expect(await transformation.transform(input)).toEqual(["one"]);
    transformation.config = "1:1";
    expect(await transformation.transform(input)).toEqual(["one"]);
    transformation.config = "1,";
    expect(await transformation.transform(input)).toEqual(["one"]);
  });
  it("selects multiple single items", async () => {
    const transformation = new RangeTransformation();
    transformation.config = "1,0";
    expect(await transformation.transform(input)).toEqual(["one", "zero"]);
  });
  it("selects single range with start and end", async () => {
    const transformation = new RangeTransformation();
    transformation.config = "1:2";
    expect(await transformation.transform(input)).toEqual(["one", "two"]);
  });
  it("selects single range without end", async () => {
    const transformation = new RangeTransformation();
    transformation.config = "1:";
    expect(await transformation.transform(input)).toEqual([
      "one",
      "two",
      "three",
    ]);
  });
  it("selects single range without start", async () => {
    const transformation = new RangeTransformation();
    transformation.config = ":2";
    expect(await transformation.transform(input)).toEqual([
      "zero",
      "one",
      "two",
    ]);
  });
  it("selects multiple ranges", async () => {
    const transformation = new RangeTransformation();
    transformation.config = "1:2,:2, 1:";
    expect(await transformation.transform(input)).toEqual([
      "one",
      "two",
      "zero",
      "one",
      "two",
      "one",
      "two",
      "three",
    ]);
  });
  it("tolerates too wide ranges", async () => {
    const transformation = new RangeTransformation();
    transformation.config = "1:1000";
    expect(await transformation.transform(input)).toEqual([
      "one",
      "two",
      "three",
    ]);
    transformation.config = "100:1000";
    expect(await transformation.transform(input)).toEqual([]);
  });
  it("tolerates impossible ranges", async () => {
    const transformation = new RangeTransformation();
    transformation.config = "2:1";
    expect(await transformation.transform(input)).toEqual([]);
  });
  it("ignores empty range configurations", async () => {
    const transformation = new RangeTransformation();
    transformation.config = ",1:2,,1";
    expect(await transformation.transform(input)).toEqual([
      "one",
      "two",
      "one",
    ]);
    transformation.config = "";
    expect(await transformation.transform(input)).toEqual([]);
  });
  it("ignores empty ranges", async () => {
    const transformation = new RangeTransformation();
    transformation.config = "1000";
    expect(await transformation.transform(input)).toEqual([]);
  });
  it("rejects invalid range config", async () => {
    expect(() => new RangeTransformation(undefined, ":")).toThrow(
      TransformationConfigTypeError
    );
    const transformation = new RangeTransformation();
    expect(() => (transformation.config = ":")).toThrow(
      TransformationConfigTypeError
    );
    expect(() => (transformation.config = "1:2:3")).toThrow(
      TransformationConfigTypeError
    );
  });
});

describe("Match transformation", () => {
  it("extracts single occurrence of target substring", async () => {
    const transformation = new MatchTransformation();
    transformation.config = "matching";
    const input = ["a substring inside a string"];
    expect(await transformation.transform(input)).toEqual(["substring"]);
  });

  it("extracts multiple occurrences of target substring", async () => {
    const transformation = new MatchTransformation();
    transformation.config = "substring";
    const input = ["a substring and another substring inside a string"];
    expect(await transformation.transform(input)).toEqual([
      "substring",
      "substring",
    ]);
  });

  it("returns empty array for non-matching substring", async () => {
    const transformation = new MatchTransformation();
    transformation.config = "substring";
    const input = ["a string without target"];
    expect(await transformation.transform(input)).toEqual([]);
  });

  it("extracts single occurrence of target itemwise", async () => {
    const transformation = new MatchTransformation();
    transformation.config = "matching";
    const input = ["a matching string", "another matching string"];
    expect(await transformation.transform(input)).toEqual([
      "matching",
      "matching",
    ]);
  });

  it("ignores input items without target substring", async () => {
    const transformation = new MatchTransformation();
    transformation.config = "substring";
    const input = [
      "a string with substring",
      "a string without",
      "another with substring",
    ];
    expect(await transformation.transform(input)).toEqual([
      "substring",
      "substring",
    ]);
  });

  it("combines input before matching if itemwise off", async () => {
    const transformation = new MatchTransformation(false);
    transformation.config = "sub,string";
    const input = ["a sub", "string in combined string"];
    expect(await transformation.transform(input)).toEqual(["sub,string"]);
  });

  it("supports regular expressions between //, including flags", async () => {
    const transformation = new MatchTransformation(false);
    transformation.config = "/(sub)?string/i";
    const input = ["a Substring inside a string"];
    expect(await transformation.transform(input)).toEqual([
      "Substring",
      "string",
    ]);
  });

  it("accepts optional double quotes to force plain string matching", async () => {
    const transformation = new MatchTransformation(false);
    transformation.config = '"/(sub)?string/i"';
    const input = ["a Substring inside a string", "/(sub)?string/i"];
    expect(await transformation.transform(input)).toEqual(["/(sub)?string/i"]);
  });
});
