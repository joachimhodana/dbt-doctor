import type { Diagnostic } from "@dbt-doctor/types";
import type { Rule } from "../types.js";
import { report } from "../utils/report.js";
import { offsetToLineColumn, parseSqlWithCst, walkCst } from "../utils/sql-cst.js";

const hasSpace = (parts: unknown): boolean => Array.isArray(parts) && parts.some((part) => (part as { type?: string }).type === "space");

export const sqlCteBracketPosition: Rule = {
  id: "sql-cte-bracket-position",
  severity: "warn",
  category: "SQL Style",
  recommendation: "Use one space between AS and opening parenthesis in CTE definitions.",
  tags: ["style", "phase5"],
  run: ({ sqlFiles, readFile, project }) => {
    const diagnostics: Diagnostic[] = [];

    for (const filePath of sqlFiles) {
      const content = readFile(filePath);
      const parsed = parseSqlWithCst(filePath, content, project.adapter);
      if (!parsed) continue;

      walkCst(parsed.cst, {
        common_table_expr: (node: { asKw?: { trailing?: unknown; range?: [number, number] } }) => {
          if (!node.asKw?.range) return;
          if (hasSpace(node.asKw.trailing)) return;

          const position = offsetToLineColumn(content, node.asKw.range[1]);
          diagnostics.push(
            report(
              sqlCteBracketPosition,
              filePath,
              "CTE AS clause should include a space before opening parenthesis.",
              "Format CTEs as `name AS ( ... )` (SQLFluff LT07 parity).",
              position.line,
              position.column,
            ),
          );
        },
      });
    }

    return diagnostics;
  },
};
