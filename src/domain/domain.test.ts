import { Domain } from "./domain";

describe("Domain class", () => {
  test("domain property is initialized", () => {
    expect(new Domain("example.com").domain).toBe("example.com");
  });
});
