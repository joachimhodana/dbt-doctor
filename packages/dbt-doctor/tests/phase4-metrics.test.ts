import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vite-plus/test";
import type { Diagnostic } from "@dbt-doctor/types";
import { discoverProject } from "@dbt-doctor/project-info";
import { computeCoverageMetrics, computePerModelScores } from "../src/phase4-metrics.js";

const fixture = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures/basic-dbt");

describe("phase4 metrics", () => {
  it("computes docs/test coverage from model SQL + YAML metadata", async () => {
    const project = await discoverProject(fixture);
    const coverage = computeCoverageMetrics(fixture, project);

    expect(coverage.totalModels).toBe(5);
    expect(coverage.documentedModels).toBe(1);
    expect(coverage.testedModels).toBe(1);
    expect(coverage.documentedPercent).toBe(20);
    expect(coverage.testedPercent).toBe(20);
  });

  it("computes per-model scores and sorts worst-first", async () => {
    const project = await discoverProject(fixture);
    const diagnostics: Diagnostic[] = [
      {
        filePath: "models/marts/fct_bad_patterns.sql",
        plugin: "dbt-doctor",
        rule: "no-select-star",
        severity: "error",
        message: "Avoid select star",
        line: 1,
        column: 1,
      },
    ];

    const scores = computePerModelScores(diagnostics, fixture, project, "unique-rules");

    expect(scores).toHaveLength(5);
    expect(scores[0]?.filePath).toBe("models/marts/fct_bad_patterns.sql");
    expect(scores[0]?.diagnosticCount).toBe(1);
    expect(scores[0]?.score).toBeLessThan(scores[scores.length - 1]?.score ?? 10);
  });
});
