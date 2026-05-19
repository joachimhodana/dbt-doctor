import { describe, expect, it } from "vite-plus/test";
import {
  DEFAULT_SURFACE_EXCLUDED_TAGS,
  DIAGNOSTIC_SURFACES,
  filterDiagnosticsForSurface,
  isDiagnosticSurface,
} from "@dbt-doctor/core";
import type { Diagnostic, DbtDoctorConfig } from "@dbt-doctor/types";

const sqlDiagnostic: Diagnostic = {
  filePath: "models/stg_users.sql",
  plugin: "dbt-doctor",
  rule: "no-select-star",
  severity: "error",
  message: "Avoid SELECT *",
  help: "",
  line: 1,
  column: 1,
  category: "SQL Quality",
};

describe("filterDiagnosticsForSurface", () => {
  it("passes through diagnostics when no surface exclusions apply", () => {
    expect(filterDiagnosticsForSurface([sqlDiagnostic], "cli", null)).toEqual([sqlDiagnostic]);
  });

  it("excludes rules by category on a surface", () => {
    const config: DbtDoctorConfig = {
      surfaces: { ciFailure: { excludeCategories: ["SQL Quality"] } },
    };
    expect(filterDiagnosticsForSurface([sqlDiagnostic], "ciFailure", config)).toEqual([]);
  });

  it("excludes rules by rule key on CLI", () => {
    const config: DbtDoctorConfig = {
      surfaces: { cli: { excludeRules: ["dbt-doctor/no-select-star"] } },
    };
    expect(filterDiagnosticsForSurface([sqlDiagnostic], "cli", config)).toEqual([]);
  });
});

describe("DiagnosticSurface guards", () => {
  it("accepts only known surface names", () => {
    for (const surface of DIAGNOSTIC_SURFACES) {
      expect(isDiagnosticSurface(surface)).toBe(true);
    }
    expect(isDiagnosticSurface("unknown")).toBe(false);
  });

  it("excludes only design tags from score by default (style counts toward score)", () => {
    expect(DEFAULT_SURFACE_EXCLUDED_TAGS.score).toEqual(["design"]);
    expect(DEFAULT_SURFACE_EXCLUDED_TAGS.score).not.toContain("style");
  });
});
