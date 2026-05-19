import { describe, expect, it } from "vite-plus/test";
import { applyConfigPreset } from "@dbt-doctor/core";

describe("applyConfigPreset", () => {
  it("returns null for null config", () => {
    expect(applyConfigPreset(null)).toBeNull();
  });

  it("leaves default preset unchanged", () => {
    const config = { preset: "default" as const, failOn: "none" as const };
    expect(applyConfigPreset(config)).toEqual(config);
  });

  it("applies strict preset defaults", () => {
    const config = applyConfigPreset({ preset: "strict" });
    expect(config?.failOn).toBe("error");
    expect(config?.ignore?.tags).toEqual([]);
  });

  it("applies enterprise preset defaults", () => {
    const config = applyConfigPreset({ preset: "enterprise" });
    expect(config?.scoreMode).toBe("files");
    expect(config?.failOn).toBe("warning");
    expect(config?.ignore?.tags).toEqual(["style"]);
    expect(config?.categories).toEqual({
      Governance: "error",
      Architecture: "error",
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
