import { describe, expect, it } from "vitest";
import { mergeConfigWithCliFlags } from "@dbt-doctor/core";

describe("mergeConfigWithCliFlags", () => {
  it("merges CLI overrides onto file config", () => {
    expect(
      mergeConfigWithCliFlags(
        { scoreMode: "unique-rules", preset: "default" },
        {
          scoreMode: "files",
          preset: "enterprise",
          manifest: "target/manifest.json",
        },
      ),
    ).toEqual({
      scoreMode: "files",
      preset: "enterprise",
      manifestPath: "target/manifest.json",
    });
  });

  it("returns null when no config and no overrides", () => {
    expect(mergeConfigWithCliFlags(null, {})).toBeNull();
  });
});
