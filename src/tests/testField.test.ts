import { TestField } from "./testField";
import log from "loglevel";

describe("Test field instatiation", () => {
  it("Instantiates new test field", () => {
    const field = new TestField({
      fieldname: "itemType",
      goal: ["webpage"],
    });
    expect(field.name).toBe("itemType");
    expect(field.goal).toEqual(["webpage"]);
  });

  it("Rejects instantiating control fields", () => {
    expect(() => {
      new TestField({
        fieldname: "control", // a field type marked as control field
        goal: [],
      });
    }).toThrow("is a control field");
  });

  it("Ignores additional goal values in single-valued fields", () => {
    const warnSpy = jest.spyOn(log, "warn").mockImplementation();
    const field = new TestField({
      fieldname: "title", // a single-valued field
      goal: ["first title", "second title"],
    });
    expect(field.goal).toEqual(["first title"]);
    expect(warnSpy).toHaveBeenCalled();
  });

  it("Fail on invalid goal values", () => {
    expect(() => {
      new TestField({
        fieldname: "authorLast",
        goal: ["non-empty string", ""],
      });
    }).toThrow("not a valid goal value");
  });
});

describe("Test field testing", () => {
  it("fails on fieldname mismatch", () => {
    const field = new TestField({
      fieldname: "itemType",
      goal: ["webpage"],
    });
    expect(() => {
      field.test("title", ["some title"]);
    }).toThrow("field names do not match");
  });

  it("rejects multiple output values for single-valued fields", () => {
    const field = new TestField({
      fieldname: "itemType",
      goal: ["webpage"],
    });
    expect(() => {
      field.test("itemType", ["webpage", "newspaperArticle"]);
    }).toThrow("multiple output values");
  });

  // it rejects empty output for mandatory fields

  describe("ItemType field comparisons", () => {
    const field = new TestField({
      fieldname: "itemType",
      goal: ["webpage"],
    });

    it("compares matching itemType values", () => {
      const score = field.test("itemType", ["webpage"]);
      expect(score).toBe(1);
    });

    it("compares non-matching itemType values", () => {
      const score = field.test("itemType", ["newspaperArticle"]);
      expect(score).toBe(0);
    });
  });

  describe("Date field comparisons", () => {
    describe("Full-date goal", () => {
      const field = new TestField({
        fieldname: "date",
        goal: ["2012-10-05"],
      });

      it("empty output", () => {
        const score = field.test("date", []);
        expect(score).toBe(0);
      });

      it("full match", () => {
        const score = field.test("date", ["2012-10-05"]);
        expect(score).toBe(1);
      });

      it("partial matches", () => {
        expect(field.test("date", ["2012-10-23"])).toBe(2 / 3);
        expect(field.test("date", ["2010-12-05"])).toBe(1 / 3);
        expect(field.test("date", ["2010-12-23"])).toBe(0);
      });

      it("missing parts", () => {
        expect(field.test("date", ["2012-10"])).toBe(2 / 3);
        expect(field.test("date", ["2012"])).toBe(1 / 3);
      });
    });
  });
});
