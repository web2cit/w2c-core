import { PathPattern } from "./pattern";

it("returns true for match", () => {
  const pattern = new PathPattern("/**/dir/*.html");
  expect(pattern.match("/path/to/dir/page.html")).toBe(true);
});

it("returns false for no match", () => {
  const pattern = new PathPattern("/**/dir/*.html");
  expect(pattern.match("/path/to/dir/subdir/page.html")).toBe(false);
});

it("ignores target query strings", () => {
  const pattern = new PathPattern("/**/dir/*.html"); // should it be **/dir?
  expect(pattern.match("/dir/page.html?query=id")).toBe(true);
});

// it rejects wrong glob

// it normalizes target path prior to matching
