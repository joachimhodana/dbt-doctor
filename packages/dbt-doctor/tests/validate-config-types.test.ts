import { describe, expect, it, vi } from "vite-plus/test";
import { validateConfigTypes } from "@dbt-doctor/core";

describe("validateConfigTypes", () => {
  it("keeps preset and scoreMode", () => {
    expect(
      validateConfigTypes({
        preset: "enterprise",
        scoreMode: "files",
        useSqlfluff: true,
      }),
    ).toMatchObject({
      preset: "enterprise",
      scoreMode: "files",
      useSqlfluff: true,
    });
  });

  it("strips invalid tier-4 fields", () => {
    const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const config = validateConfigTypes({
      preset: "x" as "enterprise",
      scoreMode: "x" as "files",
    });
    expect(config.preset).toBeUndefined();
    expect(config.scoreMode).toBeUndefined();
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

  it("keeps numeric score thresholds and strips invalid values", () => {
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
