import type { Diagnostic } from "@dbt-doctor/types";
import type { Rule } from "../types.js";
import { report } from "../utils/report.js";
import { offsetToLineColumn, parseSqlWithCst, walkCst } from "../utils/sql-cst.js";

const hasBlankLineBetween = (content: string, start: number, end: number): boolean => {
  const chunk = content.slice(start, end);
  return /\r?\n\s*\r?\n/.test(chunk);
};

export const sqlCteBlankLineAfter: Rule = {
  id: "sql-cte-blank-line-after",
  severity: "warn",
  category: "SQL Style",
  recommendation: "Insert a blank line between the final CTE and the main SELECT.",
  tags: ["style", "sql-style"],
  run: ({ sqlFiles, readFile, project }) => {
    const diagnostics: Diagnostic[] = [];

    for (const filePath of sqlFiles) {
      const content = readFile(filePath);
      const parsed = parseSqlWithCst(filePath, content, project.adapter);
      if (!parsed) continue;

      walkCst(parsed.cst, {
        select_stmt: (node: { clauses?: Array<{ type?: string; range?: [number, number] }> }) => {
          const clauses = node.clauses ?? [];
          const withClauseIndex = clauses.findIndex((clause) => clause.type === "with_clause");
          if (withClauseIndex < 0) return;

          const withClause = clauses[withClauseIndex];
          const nextClause = clauses[withClauseIndex + 1];
          if (!withClause?.range || !nextClause?.range) return;

          if (hasBlankLineBetween(content, withClause.range[1], nextClause.range[0])) return;

          const position = offsetToLineColumn(content, nextClause.range[0]);
          diagnostics.push(
            report(
              sqlCteBlankLineAfter,
              filePath,
              "Add a blank line after the WITH/CTE block before the main query.",
              "Separate CTE definitions from the consuming SELECT with an empty line (SQLFluff LT08 parity).",
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
