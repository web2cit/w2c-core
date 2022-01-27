import {
  DateTransformation,
  JoinTransformation,
  TransformationConfigTypeError,
} from "./transformation";

describe("Join tranformation", () => {
  const input = ["an", "array", "of", "strings"];
  it("joins input with default settings", () => {
    const transformation = new JoinTransformation();
    const output = transformation.transform(input);
    expect(output).toEqual(["an,array,of,strings"]);
  });
  it("joins input itemwise", () => {
    const transformation = new JoinTransformation(true);
    const output = transformation.transform(input);
    expect(output).toEqual(["a,n", "a,r,r,a,y", "o,f", "s,t,r,i,n,g,s"]);
  });
  it("joins input with custom separator", () => {
    const transformation = new JoinTransformation(undefined, "|");
    const output = transformation.transform(input);
    expect(output).toEqual(["an|array|of|strings"]);
  });
});

describe("Date transformation", () => {
  it("parses English dates", () => {
    const transformation = new DateTransformation();
    expect(transformation.transform(["January 27, 2022"])).toEqual([
      "2022-01-27",
    ]);
    expect(transformation.transform(["yesterday"])).toEqual([
      new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    ]);
  });
  it("parses Spanish dates", () => {
    const transformation = new DateTransformation(undefined, "es");
    expect(transformation.transform(["27 de enero de 2022"])).toEqual([
      "2022-01-27",
    ]);
    expect(transformation.transform(["ayer"])).toEqual([
      new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    ]);
  });
  it("rejects unsupported locales", () => {
    expect(() => new DateTransformation(undefined, "xx" as never)).toThrow(
      TransformationConfigTypeError
    );
  });
  it("ignores unknown dates", () => {
    const transformation = new DateTransformation();
    expect(transformation.transform(["not a date"])).toEqual(["not a date"]);
  });
  it("parses dates without a day", () => {
    const transformation = new DateTransformation();
    expect(transformation.transform(["January 2022"])).toEqual(["2022-01"]);
  });
});
