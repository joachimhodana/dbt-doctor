import { describe, expect, it, vi } from "vite-plus/test";
import { validateConfigTypes } from "@dbt-doctor/core";

describe("validateConfigTypes", () => {
  it("keeps preset, scoreMode, and baseline", () => {
    expect(
      validateConfigTypes({
        preset: "enterprise",
        scoreMode: "files",
        baseline: true,
        useSqlfluff: true,
      }),
    ).toMatchObject({
      preset: "enterprise",
      scoreMode: "files",
      baseline: true,
      useSqlfluff: true,
    });
  });

  it("strips invalid tier-4 fields", () => {
    const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const config = validateConfigTypes({
      preset: "x" as "enterprise",
      scoreMode: "x" as "files",
      baseline: 1 as unknown as boolean,
    });
    expect(config.preset).toBeUndefined();
    expect(config.scoreMode).toBeUndefined();
    expect(config.baseline).toBeUndefined();
    stderr.mockRestore();
  });

  it("keeps ruleConfig object entries and strips invalid ones", () => {
    const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const config = validateConfigTypes({
      ruleConfig: {
        "model-name-contract": {
          pattern: "^(stg|int|fct)_[a-z0-9_]+$",
          minSegments: 2,
        },
        "bad-rule": "oops" as unknown as Record<string, unknown>,
      },
    });
    expect(config.ruleConfig).toEqual({
      "model-name-contract": {
        pattern: "^(stg|int|fct)_[a-z0-9_]+$",
        minSegments: 2,
      },
    });
    stderr.mockRestore();
  });

  it("keeps numeric phase4 thresholds and strips invalid values", () => {
    const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const config = validateConfigTypes({
      failProjectUnder: 6.5,
      failAnyItemUnder: "abc" as unknown as number,
    });
    expect(config.failProjectUnder).toBe(6.5);
    expect(config.failAnyItemUnder).toBeUndefined();
    stderr.mockRestore();
  });
});
