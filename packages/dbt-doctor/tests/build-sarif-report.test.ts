import { describe, expect, it } from "vite-plus/test";
import { buildSarifReport } from "@dbt-doctor/core";
import type { Diagnostic } from "@dbt-doctor/types";

const sampleDiagnostic = (overrides: Partial<Diagnostic> = {}): Diagnostic => ({
  filePath: "models/marts/fct_orders.sql",
  plugin: "dbt-doctor",
  rule: "no-select-star",
  severity: "error",
  message: "Avoid SELECT *",
  help: "List columns explicitly",
  line: 0,
  column: 0,
  category: "SQL",
  ...overrides,
});

describe("buildSarifReport", () => {
  it("builds SARIF 2.1 with tool metadata and results", () => {
    const diagnostics = [
      sampleDiagnostic(),
      sampleDiagnostic({ rule: "model-has-tests", severity: "warning", line: 5 }),
    ];
    const sarif = buildSarifReport(diagnostics, "0.0.2");

    expect(sarif.version).toBe("2.1.0");
    expect(sarif.runs[0].tool.driver).toEqual({
      name: "dbt-doctor",
      version: "0.0.2",
      rules: [
        { id: "dbt-doctor/no-select-star", shortDescription: { text: "dbt-doctor/no-select-star" } },
        {
          id: "dbt-doctor/model-has-tests",
          shortDescription: { text: "dbt-doctor/model-has-tests" },
        },
      ],
    });
    expect(sarif.runs[0].results).toHaveLength(2);
    expect(sarif.runs[0].results[0].level).toBe("error");
    expect(sarif.runs[0].results[1].level).toBe("warning");
    expect(sarif.runs[0].results[0].locations[0].physicalLocation.region).toEqual({
      startLine: 1,
      startColumn: 1,
    });
  });
});
