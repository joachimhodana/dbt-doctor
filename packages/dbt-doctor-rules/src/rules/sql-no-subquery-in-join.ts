import type { Rule } from "../types.js";
import { offsetToLineColumn } from "../utils/sql-cst.js";
import { report } from "../utils/report.js";

const JOIN_SUBQUERY_PATTERN = /\bjoin\s*\(\s*select\b/gi;

export const sqlNoSubqueryInJoin: Rule = {
  id: "sql-no-subquery-in-join",
  severity: "warn",
  category: "SQL Quality",
  tags: ["style", "sql-style"],
  recommendation: "Avoid subqueries inside JOIN clauses; prefer CTEs for readability and reuse.",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];

    for (const file of sqlFiles) {
      const content = readFile(file);
      for (const match of content.matchAll(JOIN_SUBQUERY_PATTERN)) {
        if (match.index === undefined) continue;
        const position = offsetToLineColumn(content, match.index);
        diagnostics.push(
          report(
            sqlNoSubqueryInJoin,
            file,
            "JOIN contains an inline subquery",
            "Extract the subquery into a CTE and JOIN the CTE instead.",
            position.line,
            position.column,
          ),
        );
      }
    }

    return diagnostics;
  },
};
