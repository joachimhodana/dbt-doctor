import { describe, expect, it } from "vite-plus/test";
import type { InspectResult, ProjectInfo } from "@dbt-doctor/types";
import { shouldFailForScoreThresholds } from "../src/cli/utils/should-fail-for-score-thresholds.js";

const SAMPLE_PROJECT: ProjectInfo = {
  rootDirectory: "/repo",
  projectName: "sample_dbt",
  dbtVersion: "1.8.0",
  adapter: "snowflake",
  profileName: "default",
  modelPaths: ["models"],
  macroPaths: ["macros"],
  testPaths: ["tests"],
  seedPaths: ["seeds"],
  snapshotPaths: ["snapshots"],
  analysisPaths: ["analyses"],
  sourceFileCount: 1,
};

const makeResult = (score: number, perModelScore?: number): InspectResult => {
  const result: InspectResult = {
    diagnostics: [],
    score: { score, label: "Score" },
    skippedChecks: [],
    project: SAMPLE_PROJECT,
    elapsedMilliseconds: 1,
  };

  if (typeof perModelScore === "number") {
    result.perModelScores = [
      {
        modelName: "stg_customers",
        filePath: "models/staging/stg_customers.sql",
        score: perModelScore,
        label: "Item score",
        diagnosticCount: 0,
      },
    ];
  }

  return result;
};

describe("shouldFailForScoreThresholds", () => {
  it("returns false when no thresholds are configured", () => {
    expect(shouldFailForScoreThresholds([makeResult(4.2, 3.0)], null)).toBe(false);
  });

  it("fails when project score is under failProjectUnder", () => {
    expect(shouldFailForScoreThresholds([makeResult(4.2, 9.9)], { failProjectUnder: 5 })).toBe(
      true,
    );
  });

  it("fails when any item score is under failAnyItemUnder", () => {
    expect(shouldFailForScoreThresholds([makeResult(9.9, 4.2)], { failAnyItemUnder: 5 })).toBe(
      true,
    );
  });

  it("passes when all threshold checks pass", () => {
    expect(
      shouldFailForScoreThresholds([makeResult(9.1, 8.4)], {
        failProjectUnder: 5,
        failAnyItemUnder: 5,
      }),
    ).toBe(false);
  });
});
