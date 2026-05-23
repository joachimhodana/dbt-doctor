import type { Rule } from "../types.js";
import { report } from "../utils/report.js";
import { offsetToLineColumn, parseSqlWithCst, walkCst } from "../utils/sql-cst.js";

export const sqlAmbiguousDistinctGroupBy: Rule = {
  id: "sql-ambiguous-distinct-group-by",
  severity: "warn",
  category: "SQL Style",
  recommendation: "Avoid combining DISTINCT with GROUP BY in the same SELECT statement.",
  tags: ["style", "phase5"],
  run: ({ sqlFiles, readFile, project }) => {
    const diagnostics = [];

    for (const filePath of sqlFiles) {
      const content = readFile(filePath);
      const parsed = parseSqlWithCst(filePath, content, project.adapter);
      if (!parsed) continue;

      walkCst(parsed.cst, {
        select_stmt: (node: { clauses?: Array<{ type?: string; range?: [number, number]; modifiers?: Array<{ type?: string }> }> }) => {
          const clauses = node.clauses ?? [];
          const selectClause = clauses.find((clause) => clause.type === "select_clause") as
            | { range?: [number, number]; modifiers?: Array<{ type?: string }> }
            | undefined;
          const hasGroupBy = clauses.some((clause) => clause.type === "group_by_clause");
          const hasDistinct = Boolean(selectClause?.modifiers?.some((modifier) => modifier.type === "select_distinct"));

          if (!hasDistinct || !hasGroupBy || !selectClause?.range) return;

          const position = offsetToLineColumn(content, selectClause.range[0]);
          diagnostics.push(
            report(
              sqlAmbiguousDistinctGroupBy,
              filePath,
              "SELECT uses both DISTINCT and GROUP BY.",
              "Use GROUP BY alone or remove redundant DISTINCT to avoid ambiguous intent (SQLFluff AM01 parity).",
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
