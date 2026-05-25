import type { Rule } from "../types.js";
import { offsetToLineColumn } from "../utils/sql-cst.js";
import { report } from "../utils/report.js";

const INVALID_NULL_COMPARISON_PATTERN = /(=|<>|!=)\s*null\b/gi;

export const sqlNullComparisonOperator: Rule = {
  id: "sql-null-comparison-operator",
  severity: "warn",
  category: "SQL Quality",
  recommendation: "Use IS NULL / IS NOT NULL instead of equality operators with NULL.",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];

    for (const file of sqlFiles) {
      const content = readFile(file);

      for (const match of content.matchAll(INVALID_NULL_COMPARISON_PATTERN)) {
        if (match.index === undefined) continue;
        const operator = match[1] ?? "=";
        const position = offsetToLineColumn(content, match.index);
        const fixHint = operator === "=" ? "IS NULL" : "IS NOT NULL";

        diagnostics.push(
          report(
            sqlNullComparisonOperator,
            file,
            `Invalid NULL comparison using "${operator}"`,
            `Replace with ${fixHint}.`,
            position.line,
            position.column,
          ),
        );
      }
    }

    return diagnostics;
  },
};
