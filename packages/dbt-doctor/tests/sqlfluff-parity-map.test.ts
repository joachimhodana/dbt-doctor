import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { ALL_DBT_DOCTOR_RULES } from "dbt-doctor-rules";

interface SqlfluffParityRow {
  sqlfluffCode: string;
  status: string;
  ruleIds: string[];
}

const loadSqlfluffParityRows = (): SqlfluffParityRow[] => {
  const parityPath = path.resolve(
    process.cwd(),
    "..",
    "website",
    "docs",
    "tool-parity",
    "sqlfluff.md",
  );
  const markdown = fs.readFileSync(parityPath, "utf8");

  const rows: SqlfluffParityRow[] = [];
  for (const line of markdown.split(/\r?\n/u)) {
    const row = line.match(
      /^\|\s*`([A-Z]{2}\d{2})`\s*\|\s*(Covered|Partial|Not planned)\s*\|\s*(.+)\s*\|$/,
    );
    if (!row) continue;
    const ruleIds = Array.from(row[3].matchAll(/`([a-z0-9-]+)`/g), (match) => match[1]);
    rows.push({
      sqlfluffCode: row[1],
      status: row[2],
      ruleIds,
    });
  }
  return rows;
};

describe("sqlfluff parity map integrity", () => {
  it("keeps full SQLFluff map at 100% covered and references valid dbt-doctor rules", () => {
    const rows = loadSqlfluffParityRows();
    const uniqueCodes = new Set(rows.map((entry) => entry.sqlfluffCode));
    const knownRuleIds = new Set(ALL_DBT_DOCTOR_RULES.map((rule) => rule.id));

    expect(rows.length).toBe(74);
    expect(uniqueCodes.size).toBe(74);
    expect(rows.every((entry) => entry.status === "Covered")).toBe(true);

    for (const entry of rows) {
      expect(entry.ruleIds.length).toBeGreaterThan(0);
      for (const ruleId of entry.ruleIds) {
        expect(knownRuleIds.has(ruleId)).toBe(true);
      }
    }
  });
});
