import type { Rule } from "../types.js";
import { offsetToLineColumn, parseSqlWithCst } from "../utils/sql-cst.js";
import { report } from "../utils/report.js";

export const sqlSingleStatementModel: Rule = {
  id: "sql-single-statement-model",
  severity: "warn",
  category: "SQL Quality",
  recommendation: "Keep dbt model SQL to a single SELECT statement.",
  run: ({ sqlFiles, readFile, project }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      const content = readFile(file);
      const parsed = parseSqlWithCst(file, content, project.adapter);
      if (!parsed) continue;
      const statements = (parsed.cst as { statements?: Array<{ type?: string; range?: [number, number] }> }).statements ?? [];
      const nonEmpty = statements.filter((s) => s.type !== "empty");
      if (nonEmpty.length <= 1) continue;
      const second = nonEmpty[1];
      const pos = offsetToLineColumn(content, second?.range?.[0] ?? 0);
      diagnostics.push(
        report(
          sqlSingleStatementModel,
          file,
          "Model contains multiple SQL statements",
          "Use one statement per model (move setup logic into macros/hooks).",
          pos.line,
          pos.column,
        ),
      );
    }
    return diagnostics;
  },
};
