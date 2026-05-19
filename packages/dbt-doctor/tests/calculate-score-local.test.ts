import { describe, expect, it } from "vitest";
import { calculateScoreLocal } from "@dbt-doctor/core";
import type { Diagnostic } from "@dbt-doctor/types";

const diagnostic = (overrides: Partial<Diagnostic>): Diagnostic => ({
  filePath: "models/a.sql",
  plugin: "dbt-doctor",
  rule: "test-rule",
  severity: "warning",
  message: "test",
  help: "test",
  line: 1,
  column: 1,
  category: "Test",
  ...overrides,
});

describe("calculateScoreLocal", () => {
  it("returns perfect score with no diagnostics", () => {
    expect(calculateScoreLocal([]).score).toBe(100);
  });

  it("penalizes unique rules", () => {
    const result = calculateScoreLocal([
      diagnostic({ rule: "a", severity: "error" }),
      diagnostic({ rule: "a", severity: "error" }),
      diagnostic({ rule: "b", severity: "warning" }),
    ]);
    expect(result.score).toBeLessThan(100);
  });

  it("applies files score mode penalty from affected file ratio", () => {
    const result = calculateScoreLocal(
      [
        diagnostic({ filePath: "models/a.sql", rule: "a" }),
        diagnostic({ filePath: "models/b.sql", rule: "b" }),
      ],
      { scoreMode: "files", totalFilesScanned: 10 },
    );
    // 2 unique warnings (1.5) + 2/10 files × 40 = 8 → 90.5 rounds to 91
    expect(result.score).toBe(91);
  });
});
