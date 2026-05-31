import { describe, expect, it } from "vite-plus/test";
import { applyConfigPreset } from "@dbt-doctor/core";

describe("applyConfigPreset", () => {
  it("returns null for null config", () => {
    expect(applyConfigPreset(null)).toBeNull();
  });

  it("applies default preset when preset is omitted", () => {
    const config = { failOn: "none" as const };
    expect(applyConfigPreset(config)).toEqual({
      preset: "default",
      failOn: "none",
      ignore: { tags: ["enterprise", "strict", "style", "sql-style"] },
      categories: {},
      surfaces: {},
      rules: {},
    });
  });

  it("applies default preset tag filters", () => {
    const config = applyConfigPreset({ preset: "default" });
    expect(config?.ignore?.tags).toEqual(["enterprise", "strict", "style", "sql-style"]);
  });

  it("applies strict preset defaults", () => {
    const config = applyConfigPreset({ preset: "strict" });
    expect(config?.failOn).toBe("error");
    expect(config?.ignore?.tags).toEqual(["enterprise"]);
    expect(config?.categories).toEqual({
      Documentation: "error",
      Configuration: "error",
      Architecture: "error",
      "SQL Style": "warn",
      Testing: "warn",
    });
  });

  it("applies enterprise preset defaults", () => {
    const config = applyConfigPreset({ preset: "enterprise" });
    expect(config?.scoreMode).toBe("files");
    expect(config?.failOn).toBe("warning");
    expect(config?.ignore?.tags).toBeUndefined();
    expect(config?.categories).toEqual({
      Governance: "error",
      Architecture: "error",
      Sources: "error",
      Documentation: "warn",
      Performance: "warn",
      Testing: "warn",
    });
  });

  it("lets explicit user fields override preset defaults", () => {
    const config = applyConfigPreset({
      preset: "enterprise",
      failOn: "error",
      ignore: { tags: ["strict"] },
    });
    expect(config?.failOn).toBe("error");
    expect(config?.ignore?.tags).toEqual(["strict"]);
    expect(config?.scoreMode).toBe("files");
  });
});
