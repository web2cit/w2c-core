import { PatternDefinition } from "../types";
import { PatternConfiguration } from "./patternConfiguration";

const config = new PatternConfiguration(
  "example.com",
  [
    {
      pattern: "/path/to/web/page.html",
    },
    {
      pattern: "/path/to/web/*.html",
    },
    {
      pattern: "/path/to/*/*.html",
    },
    {
      pattern: "/path/**/*.html",
    },
  ],
  false
);

describe("Single path against target pattern", () => {
  it("returns non-empty array for matching path and pattern", () => {
    const path = "/path/to/subdir/index.html";
    expect(config.sortPaths(path, "/path/to/*/*.html")).toEqual([path]);
  });
  it("returns empty array for non-matching path and pattern", () => {
    const path = "/path/to/subdir/index.html";
    expect(config.sortPaths(path, "/path/to/web/*.html")).toEqual([]);
  });
  it("returns empty array if target pattern is not in the domain's list", () => {
    expect(config.sortPaths("/path/to/web/page.html", "*/*.html")).toEqual([]);
  });
});

describe("Single path without target pattern", () => {
  it("returns single-entry map for first matching pattern in domain's pattern list", () => {
    const path = "/path/to/subdir/index.html";
    expect(config.sortPaths(path)).toEqual(
      new Map([["/path/to/*/*.html", [path]]])
    );
  });
  it("returns empty map if no matching pattern in domain's pattern list", () => {
    const path = "/non/matching/path";
    expect(config.sortPaths(path)).toEqual(new Map());
  });
});

describe("Multiple paths against target pattern", () => {
  it("only returns paths matching the target pattern", () => {
    const pattern = "/path/to/*/*.html";
    const paths = [
      "/path/to/web/page.html", // matches the pattern, but matches another one in the list first
      "/path/to/subir/index.html",
    ];
    expect(config.sortPaths(paths, pattern)).toEqual([
      "/path/to/subir/index.html",
    ]);
  });
  it("returns empty array if no paths match the pattern", () => {
    const pattern = "/path/to/*/*.html";
    const paths = [
      // both should be "caught" by a previous pattern
      "/path/to/web/page.html",
      "/path/to/web/index.html",
    ];
    expect(config.sortPaths(paths, pattern)).toEqual([]);
  });
});

describe("Multiple paths without target pattern", () => {
  it("returns map for all matching patterns", () => {
    const paths = [
      "/path/to/web/page.html",
      "/path/to/sub/page.html",
      "/path/to/sub/index.html",
    ];
    expect(config.sortPaths(paths)).toEqual(
      new Map([
        ["/path/to/web/page.html", ["/path/to/web/page.html"]],
        [
          "/path/to/*/*.html",
          ["/path/to/sub/page.html", "/path/to/sub/index.html"],
        ],
      ])
    );
  });
});

it("returns json from configuration object", () => {
  const patterns: PatternDefinition[] = [
    {
      label: "some label",
      pattern: "/some/pattern/*",
    },
  ];
  const config = new PatternConfiguration("example.com", patterns);
  expect(config.toJSON()).toEqual(patterns);
});
