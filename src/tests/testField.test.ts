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

  it("fails on empty goal for mandatory fields", () => {
    expect(() => {
      new TestField({
        fieldname: "title", // a mandatory field,
        goal: [],
      });
    }).toThrow("Invalid empty goal");
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

  describe("Impossible outputs", () => {
    const field = new TestField({
      fieldname: "itemType",
      goal: ["webpage"],
    });

    it("rejects multiple output values for single-valued fields", () => {
      expect(() => {
        field.test("itemType", ["webpage", "newspaperArticle"]);
      }).toThrow("multiple output values");
    });

    it("rejects empty output for mandatory fields", () => {
      expect(() => {
        field.test("itemType", []);
      }).toThrow("empty output for mandatory field");
    });
  });

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

      it("compares to empty output", () => {
        const score = field.test("date", []);
        expect(score).toBe(0);
      });

      it("compares to full match", () => {
        const score = field.test("date", ["2012-10-05"]);
        expect(score).toBe(1);
      });

      it("compares to partial matches", () => {
        expect(field.test("date", ["2012-10-23"])).toBe(2 / 3);
        expect(field.test("date", ["2010-12-05"])).toBe(1 / 3);
        expect(field.test("date", ["2010-12-23"])).toBe(0);
      });

      it("compares to partial dates", () => {
        expect(field.test("date", ["2012-10"])).toBe(2 / 3);
        expect(field.test("date", ["2012"])).toBe(1 / 3);
      });
    });

    describe("Partial date goal", () => {
      const field = new TestField({
        fieldname: "date",
        goal: ["2012"],
      });

      it("compares to full-matching date", () => {
        expect(field.test("date", ["2012"])).toBe(1);
      });

      it("compares to non-matching date", () => {
        expect(field.test("date", ["2010"])).toBe(0);
      });

      it("compares to full date", () => {
        expect(field.test("date", ["2012-10-05"])).toBe(1 / 3);
      });

      it("compares to empty date", () => {
        expect(field.test("date", [])).toBe(0);
      });
    });

    describe("Empty date goal", () => {
      const field = new TestField({
        fieldname: "date",
        goal: [],
      });

      it("compares to empty date output", () => {
        expect(field.test("date", [])).toBe(1);
      });

      it("compares to non-empty date outputs", () => {
        expect(field.test("date", ["2012"])).toBe(0);
        expect(field.test("date", ["2012-10-05"])).toBe(0);
      });
    });
  });

  describe("Free-string field comparisons", () => {
    describe("Single-value goal", () => {
      const field = new TestField({
        fieldname: "authorFirst",
        goal: ["abc"],
      });

      it("compares to full-matching output", () => {
        expect(field.test("authorFirst", ["abc"])).toBe(1);
      });

      it("compares to non-matching single output", () => {
        expect(field.test("authorFirst", ["def"])).toBe(0);
      });

      it("compares to partial-matching single output", () => {
        expect(field.test("authorFirst", ["bcd"])).toBe(1 - 2 / 3);
      });

      it("compares to empty output", () => {
        expect(field.test("authorFirst", [])).toBe(0);
      });

      it("compares to partial-matching multiple output", () => {
        expect(field.test("authorFirst", ["abc", "def"])).toBe(
          (0.5 + 0.5) / 2 // average ordered + unordered score
        );
        expect(field.test("authorFirst", ["def", "abc"])).toBe(
          (0 + 0.5) / 2 // average ordered + unordered score
        );
      });
    });

    describe("Multiple-value goal", () => {
      const goal = ["abc", "def", "ghi"];
      const field = new TestField({
        fieldname: "authorFirst",
        goal,
      });

      it("compares to partial-matching shorter output", () => {
        const output = ["abc name", "ghi name"];
        expect(field.test("authorFirst", output)).toBe(
          ((1 - 5 / 8 + 0 + 0) / 3 + // ordered score
            (1 - 5 / 8 + 1 - 5 / 8 + 0) / 3) / // unordered score
            2
        );
      });

      it("compares to same-length output, with some full matches", () => {
        expect(field.test("authorFirst", ["abc", "ghi", "jkl"])).toBe(
          ((1 + 0 + 0) / 3 + // ordered
            (1 + 1 + 0) / 3) / // unordered
            2
        );

        expect(field.test("authorFirst", ["ghi", "jkl", "mno"])).toBe(
          ((0 + 0 + 0) / 3 + // ordered
            (1 + 0 + 0) / 3) / // unordered
            2
        );
      });

      it("compares to same-length output, with some partial matches", () => {
        const output = ["abc name", "ghi name", "jkl name"];
        expect(field.test("authorFirst", output)).toBe(
          ((1 - 5 / 8 + 0 + 0) / 3 + // ordered score
            (1 - 5 / 8 + 1 - 5 / 8 + 0) / 3) / // unordered score
            2
        );
      });
    });
  });
});
