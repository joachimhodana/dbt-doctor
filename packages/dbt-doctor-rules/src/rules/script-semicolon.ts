import type { Rule } from "../types.js";
import { report } from "../utils/report.js";
import { offsetToLineColumn, parseSqlWithCst } from "../utils/sql-cst.js";

export const scriptSemicolon: Rule = {
  id: "script-semicolon",
  severity: "warn",
  category: "SQL Quality",
  recommendation: "Terminate SQL scripts with a semicolon.",
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
      if (hasTerminalSemicolon) continue;

      const lastStatement = statements[statements.length - 1];
      const offset = lastStatement?.range?.[1] ?? content.length;
      const position = offsetToLineColumn(content, offset);

      diagnostics.push(
        report(
          scriptSemicolon,
          file,
          "SQL model does not end with a semicolon",
          "Add a trailing semicolon at the end of the statement (SQLFluff convention.terminator style).",
          position.line,
          position.column,
        ),
      );
    }

    return diagnostics;
  },
};
