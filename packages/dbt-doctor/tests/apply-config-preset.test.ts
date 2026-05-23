import { describe, expect, it } from "vite-plus/test";
import { applyConfigPreset } from "@dbt-doctor/core";

describe("applyConfigPreset", () => {
  it("returns null for null config", () => {
    expect(applyConfigPreset(null)).toBeNull();
  });

  it("leaves config unchanged when preset is omitted", () => {
    const config = { failOn: "none" as const };
    expect(applyConfigPreset(config)).toEqual(config);
  });

  it("applies default preset tag filters", () => {
    const config = applyConfigPreset({ preset: "default" });
    expect(config?.ignore?.tags).toEqual(["enterprise", "strict", "style", "phase5"]);
  });

  it("applies strict preset defaults", () => {
    const config = applyConfigPreset({ preset: "strict" });
    expect(config?.failOn).toBe("error");
    expect(config?.ignore?.tags).toEqual(["enterprise", "style", "phase5"]);
    expect(config?.categories).toEqual({
      Documentation: "error",
      Configuration: "error",
      Architecture: "error",
      Testing: "warn",
    });
  });

  it("applies enterprise preset defaults", () => {
    const config = applyConfigPreset({ preset: "enterprise" });
    expect(config?.scoreMode).toBe("files");
    expect(config?.failOn).toBe("warning");
    expect(config?.ignore?.tags).toEqual(["style", "phase5"]);
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
