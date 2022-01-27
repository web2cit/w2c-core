import {
  DateTransformation,
  JoinTransformation,
  RangeTransformation,
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
  it("parses dates without a day", () => {
    const transformation = new DateTransformation();
    expect(transformation.transform(["January 2022"])).toEqual(["2022-01"]);
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
  it("ignores empty ranges", async () => {
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
