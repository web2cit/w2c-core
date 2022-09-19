import {
  DateTransformation,
  JoinTransformation,
  RangeTransformation,
  SplitTransformation,
  MatchTransformation,
  TransformationConfigTypeError,
  Transformation,
} from "./transformation";

describe("Join tranformation", () => {
  const input = ["an", "array", "of", "strings"];
  it("joins input with default settings", async () => {
    const transformation = new JoinTransformation();
    const output = transformation.apply(input);
    expect(await output).toEqual(["an,array,of,strings"]);
  });
  it("joins input itemwise", async () => {
    const transformation = new JoinTransformation(true);
    const output = transformation.apply(input);
    expect(await output).toEqual(["a,n", "a,r,r,a,y", "o,f", "s,t,r,i,n,g,s"]);
  });
  it("joins input with custom separator", async () => {
    const transformation = new JoinTransformation(undefined, "|");
    const output = transformation.apply(input);
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
    return expect(transformation.apply(["string"])).resolves.toEqual([
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
    return expect(transformation.apply(["string"])).resolves.toEqual([
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
    return expect(transformation.apply(["one", "two"])).resolves.toEqual([
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
    return expect(transformation.apply(["one", "two"])).resolves.toEqual([
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
    expect(await transformation.apply(["January 27, 2022"])).toEqual([
      "2022-01-27",
    ]);
    expect(await transformation.apply(["yesterday"])).toEqual([
      new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    ]);
  });
  it("parses Spanish dates", async () => {
    const transformation = new DateTransformation(undefined, "es");
    expect(await transformation.apply(["27 de enero de 2022"])).toEqual([
      "2022-01-27",
    ]);
    expect(await transformation.apply(["ayer"])).toEqual([
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
    expect(await transformation.apply(["not a date"])).toEqual(["not a date"]);
  });
  // // https://phabricator.wikimedia.org/T309706
  // it("parses dates without a day", async () => {
  //   const transformation = new DateTransformation();
  //   expect(await transformation.apply(["January 2022"])).toEqual([
  //     "2022-01",
  //   ]);
  // });
});

describe("Range transformation", () => {
  const input = ["one", "two", "three", "four"];
  it("selects single item", async () => {
    const transformation = new RangeTransformation();
    transformation.config = "2";
    expect(await transformation.apply(input)).toEqual(["two"]);
    transformation.config = "2:2";
    expect(await transformation.apply(input)).toEqual(["two"]);
    transformation.config = "2,";
    expect(await transformation.apply(input)).toEqual(["two"]);
  });
  it("selects multiple single items", async () => {
    const transformation = new RangeTransformation();
    transformation.config = "2,1";
    expect(await transformation.apply(input)).toEqual(["two", "one"]);
  });
  it("selects single range with start and end", async () => {
    const transformation = new RangeTransformation();
    transformation.config = "2:3";
    expect(await transformation.apply(input)).toEqual(["two", "three"]);
  });
  it("selects single range without end", async () => {
    const transformation = new RangeTransformation();
    transformation.config = "2:";
    expect(await transformation.apply(input)).toEqual(["two", "three", "four"]);
  });
  it("selects single range without start", async () => {
    const transformation = new RangeTransformation();
    transformation.config = ":3";
    expect(await transformation.apply(input)).toEqual(["one", "two", "three"]);
  });
  it("selects multiple ranges", async () => {
    const transformation = new RangeTransformation();
    transformation.config = "2:3,:3, 2:";
    expect(await transformation.apply(input)).toEqual([
      "two",
      "three",
      "one",
      "two",
      "three",
      "two",
      "three",
      "four",
    ]);
  });
  it("tolerates too wide ranges", async () => {
    const transformation = new RangeTransformation();
    transformation.config = "2:1000";
    expect(await transformation.apply(input)).toEqual(["two", "three", "four"]);
    transformation.config = "100:1000";
    expect(await transformation.apply(input)).toEqual([]);
  });
  it("tolerates impossible ranges", async () => {
    const transformation = new RangeTransformation();
    transformation.config = "3:2";
    expect(await transformation.apply(input)).toEqual([]);
  });
  it("ignores empty range configurations", async () => {
    const transformation = new RangeTransformation();
    transformation.config = ",2:3,,2";
    expect(await transformation.apply(input)).toEqual(["two", "three", "two"]);
    transformation.config = "";
    expect(await transformation.apply(input)).toEqual([]);
  });
  it("ignores empty ranges", async () => {
    const transformation = new RangeTransformation();
    transformation.config = "1000";
    expect(await transformation.apply(input)).toEqual([]);
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
  it("rejects zero indices", async () => {
    const transformation = new RangeTransformation();
    expect(() => (transformation.config = "0")).toThrow(
      TransformationConfigTypeError
    );
    expect(() => (transformation.config = ":0")).toThrow(
      TransformationConfigTypeError
    );
  });
});

describe("Match transformation", () => {
  it("extracts single occurrence of target substring", async () => {
    const transformation = Transformation.create({
      type: "match",
      itemwise: true,
      config: "substring",
    });
    const input = ["a substring inside a string"];
    expect(await transformation.apply(input)).toEqual(["substring"]);
  });

  it("extracts multiple occurrences of target substring", async () => {
    const transformation = new MatchTransformation();
    transformation.config = "substring";
    const input = ["a substring and another substring inside a string"];
    expect(await transformation.apply(input)).toEqual([
      "substring",
      "substring",
    ]);
  });

  it("returns empty array for non-matching substring", async () => {
    const transformation = new MatchTransformation();
    transformation.config = "substring";
    const input = ["a string without target"];
    expect(await transformation.apply(input)).toEqual([]);
  });

  it("extracts single occurrence of target itemwise", async () => {
    const transformation = new MatchTransformation();
    transformation.config = "matching";
    const input = ["a matching string", "another matching string"];
    expect(await transformation.apply(input)).toEqual(["matching", "matching"]);
  });

  it("ignores input items without target substring", async () => {
    const transformation = new MatchTransformation();
    transformation.config = "substring";
    const input = [
      "a string with substring",
      "a string without",
      "another with substring",
    ];
    expect(await transformation.apply(input)).toEqual([
      "substring",
      "substring",
    ]);
  });

  it("combines input before matching if itemwise off", async () => {
    const transformation = new MatchTransformation(false);
    transformation.config = "sub,string";
    const input = ["a sub", "string in combined string"];
    expect(await transformation.apply(input)).toEqual(["sub,string"]);
  });

  it("supports regular expressions between //, including flags", async () => {
    const transformation = new MatchTransformation();
    transformation.config = "/(?:sub)?string/i";
    const input = ["a Substring inside a string"];
    expect(await transformation.apply(input)).toEqual(["Substring"]);
  });

  it("returns first regex match only, unless global flag is set", async () => {
    const transformation = new MatchTransformation();
    transformation.config = "/(?:sub)?string/i";
    const input = ["a Substring inside a string"];
    expect(await transformation.apply(input)).toEqual(["Substring"]);
    transformation.config = "/(?:sub)?string/ig";
    expect(await transformation.apply(input)).toEqual(["Substring", "string"]);
  });

  it("does not return full match if using one or more capturing groups", async () => {
    const transformation = new MatchTransformation();
    transformation.config = "/(sub)?string/i";
    const input = ["a Substring inside a string"];
    expect(await transformation.apply(input)).toEqual(["Sub"]);
  });

  it("supports capturing groups with global flag", async () => {
    const transformation = new MatchTransformation();
    transformation.config = "/(?:sub)?(str)ing/ig";
    const input = ["a Substring inside a string"];
    expect(await transformation.apply(input)).toEqual(["str", "str"]);
  });

  it("returns empty array if optional capturing group does not exist", async () => {
    const transformation = new MatchTransformation();
    transformation.config = "/(sub)?string/ig";
    const input = ["a Substring inside a string"];
    expect(await transformation.apply(input)).toEqual(["Sub"]);
  });

  it("rejects invalid regular expressions", async () => {
    const transformation = new MatchTransformation();
    expect(() => {
      transformation.config = "/+/";
    }).toThrow();
  });

  it("matches special regex characters literally in non-regex config", async () => {
    const transformation = new MatchTransformation();
    transformation.config = ".+";
    const input = ["abc.+123"];
    expect(await transformation.apply(input)).toEqual([".+"]);
  });
});
