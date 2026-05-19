import { describe, expect, it } from "vite-plus/test";
import {
  compileGlobPattern,
  InvalidGlobPatternError,
  MAX_GLOB_PATTERN_LENGTH_CHARS,
  MAX_GLOB_PATTERN_WILDCARD_COUNT,
} from "@dbt-doctor/core";

const matchGlobPattern = (filePath: string, pattern: string): boolean =>
  compileGlobPattern(pattern).test(filePath.replace(/\\/g, "/"));

const REDOS_TIME_BUDGET_MS = 100;

describe("compileGlobPattern", () => {
  it("matches exact file paths", () => {
    expect(matchGlobPattern("src/app.tsx", "src/app.tsx")).toBe(true);
    expect(matchGlobPattern("src/app.tsx", "src/other.tsx")).toBe(false);
  });

  it("matches single wildcard for filenames", () => {
    expect(matchGlobPattern("src/app.tsx", "src/*.tsx")).toBe(true);
    expect(matchGlobPattern("src/utils.ts", "src/*.tsx")).toBe(false);
    expect(matchGlobPattern("src/nested/app.tsx", "src/*.tsx")).toBe(false);
  });

  it("matches double wildcard at the end", () => {
    expect(matchGlobPattern("src/generated/foo.tsx", "src/generated/**")).toBe(true);
    expect(matchGlobPattern("src/generated/bar/baz.tsx", "src/generated/**")).toBe(true);
    expect(matchGlobPattern("src/other/foo.tsx", "src/generated/**")).toBe(false);
  });

  it("matches double wildcard with trailing slash and filename", () => {
    expect(matchGlobPattern("src/foo/test.ts", "src/**/test.ts")).toBe(true);
    expect(matchGlobPattern("src/foo/bar/test.ts", "src/**/test.ts")).toBe(true);
    expect(matchGlobPattern("src/test.ts", "src/**/test.ts")).toBe(true);
  });

  it("matches double wildcard at the start", () => {
    expect(matchGlobPattern("src/components/Button.tsx", "**/*.tsx")).toBe(true);
    expect(matchGlobPattern("Button.tsx", "**/*.tsx")).toBe(true);
    expect(matchGlobPattern("deep/nested/path/file.tsx", "**/*.tsx")).toBe(true);
    expect(matchGlobPattern("file.ts", "**/*.tsx")).toBe(false);
  });

  it("matches question mark as single character", () => {
    expect(matchGlobPattern("src/a.tsx", "src/?.tsx")).toBe(true);
    expect(matchGlobPattern("src/ab.tsx", "src/?.tsx")).toBe(false);
  });

  it("escapes regex special characters in patterns", () => {
    expect(matchGlobPattern("src/file.test.tsx", "src/*.test.tsx")).toBe(true);
    expect(matchGlobPattern("src/filetesttsx", "src/*.test.tsx")).toBe(false);
  });

  it("normalizes backslashes to forward slashes", () => {
    expect(matchGlobPattern("src\\generated\\foo.tsx", "src/generated/**")).toBe(true);
  });

  it("rejects empty patterns with a clear config error", () => {
    expect(() => compileGlobPattern("")).toThrow(InvalidGlobPatternError);
  });

  it("rejects patterns above the maximum length", () => {
    const overlongPattern = `${"a".repeat(MAX_GLOB_PATTERN_LENGTH_CHARS)}/extra.tsx`;
    expect(() => compileGlobPattern(overlongPattern)).toThrowError(
      /exceeds the maximum of \d+ characters/,
    );
  });

  it("accepts a long row of `*` at the wildcard cap (picomatch collapses runs of `*`)", () => {
    const atCapPattern = "*".repeat(MAX_GLOB_PATTERN_WILDCARD_COUNT);
    expect(() => compileGlobPattern(atCapPattern)).not.toThrow();
  });

  it("rejects patterns above the wildcard cap", () => {
    const overWildcardPattern = "*".repeat(MAX_GLOB_PATTERN_WILDCARD_COUNT + 1);
    expect(() => compileGlobPattern(overWildcardPattern)).toThrowError(/exceeding the maximum/);
  });

  it("rejects deeply-stacked `**/` globstars before compiling", () => {
    const stackedGlobstarPattern = `${"**/".repeat(20)}file.tsx`;
    expect(() => compileGlobPattern(stackedGlobstarPattern)).toThrow(InvalidGlobPatternError);
  });

  it("rejects dense `a*a*a*…` alternations before compiling (would otherwise backtrack)", () => {
    const alternatingWildcardPattern = "a*".repeat(MAX_GLOB_PATTERN_WILDCARD_COUNT + 1) + "z.tsx";
    expect(() => compileGlobPattern(alternatingWildcardPattern)).toThrow(InvalidGlobPatternError);
  });

  it("matches a borderline-stacked globstar pattern in near-constant time", () => {
    // Use a globstar count well under the cap. The hand-rolled
    // compiler we replaced hung > 30 s on this same input shape; the
    // picomatch-backed compiler returns in single-digit milliseconds.
    const stackedGlobstarPattern = `${"**/".repeat(8)}file.tsx`;
    const compiledRegex = compileGlobPattern(stackedGlobstarPattern);
    const nonMatchingDeepInput = `${"some-segment/".repeat(40)}other.ts`;

    const startedAt = performance.now();
    const matched = compiledRegex.test(nonMatchingDeepInput);
    const elapsedMilliseconds = performance.now() - startedAt;

    expect(matched).toBe(false);
    expect(elapsedMilliseconds).toBeLessThan(REDOS_TIME_BUDGET_MS);
  });
});
