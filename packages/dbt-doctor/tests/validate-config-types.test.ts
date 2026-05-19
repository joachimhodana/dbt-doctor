import { describe, expect, it, vi } from "vite-plus/test";
import { validateConfigTypes } from "@dbt-doctor/core";

describe("validateConfigTypes", () => {
  it("keeps preset, scoreMode, and baseline", () => {
    expect(
      validateConfigTypes({ preset: "enterprise", scoreMode: "files", baseline: true }),
    ).toMatchObject({ preset: "enterprise", scoreMode: "files", baseline: true });
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
});
