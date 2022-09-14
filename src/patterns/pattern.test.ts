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
  expect(pattern.match("/path/to/dir/page.html?query=id")).toBe(true);
});

it("matches globstars against nested directories", () => {
  const pattern = new PathPattern("/path/**/*.html");
  expect(pattern.match("/path/to/page.html")).toBe(true);
  expect(pattern.match("/path/to/web/page.html")).toBe(true);
});

it("matches globstars against zero", () => {
  const pattern = new PathPattern("/path/**/*.html");
  // see https://github.com/isaacs/minimatch/issues/157
  expect(pattern.match("/path/page.html")).toBe(true);
});

it('"**" matches all', () => {
  const pattern = new PathPattern("**");
  expect(pattern.match("/")).toBe(true);
  expect(pattern.match("/page")).toBe(true);
  expect(pattern.match("/page/")).toBe(true);
  expect(pattern.match("/path/page")).toBe(true);
  expect(pattern.match("/path/page/")).toBe(true);
  expect(pattern.match("path/page/")).toBe(true);
});

it('"**/*" matches all ending without "/"', () => {
  const pattern = new PathPattern("**/*");
  expect(pattern.match("/")).toBe(false);
  expect(pattern.match("/page")).toBe(true);
  expect(pattern.match("/page/")).toBe(false);
  expect(pattern.match("/path/page")).toBe(true);
  expect(pattern.match("/path/page/")).toBe(false);
});

// can't think of any wrong glob
// it("rejects wrong glob", () => {
//   expect(() => { new PathPattern("") }).toThrow();
// })

describe("target path normalization", () => {
  const pattern = new PathPattern("/path/to/dir/*.html");

  it("normalizes target path before matching", () => {
    expect(pattern.match("/path/to/../to/./dir/page.html")).toBe(true);
  });

  it("does not normalize double slashes (T316257)", () => {
    expect(pattern.match("/path//to/dir/page.html")).toBe(false);
  });
});
