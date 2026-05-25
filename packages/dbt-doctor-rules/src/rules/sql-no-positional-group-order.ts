import type { Rule } from "../types.js";
import { offsetToLineColumn } from "../utils/sql-cst.js";
import { report } from "../utils/report.js";

const POSITIONAL_PATTERN = /\b(group\s+by|order\s+by)\s+\d+\b/gi;

export const sqlNoPositionalGroupOrder: Rule = {
  id: "sql-no-positional-group-order",
  severity: "warn",
  category: "SQL Style",
  recommendation: "Use explicit column names instead of positional GROUP BY / ORDER BY references.",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      const content = readFile(file);
      for (const match of content.matchAll(POSITIONAL_PATTERN)) {
        if (match.index === undefined) continue;
        const pos = offsetToLineColumn(content, match.index);
        diagnostics.push(
          report(
            sqlNoPositionalGroupOrder,
            file,
            `Positional ${match[1]?.toUpperCase()} detected`,
            "Replace positional indexes with explicit selected columns.",
            pos.line,
            pos.column,
          ),
        );
      }
    }
    return diagnostics;
  },
};
