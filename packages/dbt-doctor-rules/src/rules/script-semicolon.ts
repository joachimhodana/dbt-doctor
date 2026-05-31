import type { Rule } from "../types.js";
import { report } from "../utils/report.js";
import { offsetToLineColumn, parseSqlWithCst } from "../utils/sql-cst.js";

export const scriptSemicolon: Rule = {
  id: "script-semicolon",
  severity: "warn",
  category: "SQL Quality",
  tags: ["strict"],
  recommendation: "Avoid a trailing semicolon at end of dbt model SQL.",
  run: ({ sqlFiles, readFile, project }) => {
    const diagnostics = [];

    for (const file of sqlFiles) {
      const content = readFile(file);
      const parsed = parseSqlWithCst(file, content, project.adapter);
      if (!parsed) continue;

      const statements = (
        parsed.cst as { statements?: Array<{ type?: string; range?: [number, number] }> }
      ).statements;
      if (!statements || statements.length === 0) continue;

      const hasTerminalSemicolon = statements[statements.length - 1]?.type === "empty";
      if (!hasTerminalSemicolon) continue;

      const lastStatement = statements[statements.length - 1];
      const offset = lastStatement?.range?.[1] ?? content.length;
      const position = offsetToLineColumn(content, offset);

      diagnostics.push(
        report(
          scriptSemicolon,
          file,
          "SQL model ends with a trailing semicolon",
          "Remove the semicolon at end-of-file for dbt model compatibility.",
          position.line,
          position.column,
        ),
      );
    }

    return diagnostics;
  },
};
