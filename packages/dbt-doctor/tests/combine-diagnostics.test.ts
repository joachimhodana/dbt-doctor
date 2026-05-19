import { describe, expect, it } from "vite-plus/test";
import type { Diagnostic, DbtDoctorConfig } from "@dbt-doctor/types";
import { combineDiagnostics, computeSqlIncludePaths } from "@dbt-doctor/core";

const createDiagnostic = (overrides: Partial<Diagnostic> = {}): Diagnostic => ({
  filePath: "src/app.tsx",
  plugin: "dbt-doctor",
  rule: "test-rule",
  severity: "warning",
  message: "test message",
  help: "test help",
  line: 1,
  column: 1,
  category: "Test",
  ...overrides,
});

describe("computeSqlIncludePaths", () => {
  it("returns undefined for empty include paths", () => {
    expect(computeSqlIncludePaths([])).toBeUndefined();
  });

  it("filters to SQL and YAML files", () => {
    const paths = ["models/a.sql", "README.md", "models/schema.yml", "dbt_project.yml"];
    expect(computeSqlIncludePaths(paths)).toEqual([
      "models/a.sql",
      "models/schema.yml",
      "dbt_project.yml",
    ]);
  });

  it("returns empty array when no SQL/YAML files exist", () => {
    expect(computeSqlIncludePaths(["README.md", "package.json"])).toEqual([]);
  });
});

describe("combineDiagnostics", () => {
  it("returns lint diagnostics unchanged in diff mode", () => {
    const lintDiagnostics = [createDiagnostic({ rule: "lint-rule" })];

    const result = combineDiagnostics({
      lintDiagnostics,
      directory: "/tmp",
      isDiffMode: true,
      userConfig: null,
    });
    expect(result).toHaveLength(1);
    expect(result[0].rule).toBe("lint-rule");
  });

  it("returns empty array when input is empty in diff mode", () => {
    const result = combineDiagnostics({
      lintDiagnostics: [],
      directory: "/tmp",
      isDiffMode: true,
      userConfig: null,
    });
    expect(result).toEqual([]);
  });

  it("applies config filtering when userConfig is provided", () => {
    const diagnostics = [
      createDiagnostic({ plugin: "react", rule: "no-danger" }),
      createDiagnostic({ plugin: "dbt-doctor", rule: "no-giant-component" }),
    ];
    const config: DbtDoctorConfig = {
      ignore: { rules: ["react/no-danger"] },
    };

    const result = combineDiagnostics({
      lintDiagnostics: diagnostics,
      directory: "/tmp",
      isDiffMode: true,
      userConfig: config,
    });
    expect(result).toHaveLength(1);
    expect(result[0].rule).toBe("no-giant-component");
  });

  it("skips config filtering when userConfig is null", () => {
    const diagnostics = [createDiagnostic(), createDiagnostic()];
    const result = combineDiagnostics({
      lintDiagnostics: diagnostics,
      directory: "/tmp",
      isDiffMode: true,
      userConfig: null,
    });
    expect(result).toHaveLength(2);
  });
});
