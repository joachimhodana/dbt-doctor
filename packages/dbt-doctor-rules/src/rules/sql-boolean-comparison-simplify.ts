import type { Rule } from "../types.js";
import { offsetToLineColumn } from "../utils/sql-cst.js";
import { report } from "../utils/report.js";

const BOOL_COMPARE_PATTERN = /(=|!=|<>)\s*(true|false)\b/gi;

export const sqlBooleanComparisonSimplify: Rule = {
  id: "sql-boolean-comparison-simplify",
  severity: "warn",
  category: "SQL Quality",
  recommendation: "Avoid explicit boolean equality comparisons where predicate forms are clearer.",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      const content = readFile(file);
      for (const match of content.matchAll(BOOL_COMPARE_PATTERN)) {
        if (match.index === undefined) continue;
        const pos = offsetToLineColumn(content, match.index);
        diagnostics.push(
          report(
            sqlBooleanComparisonSimplify,
            file,
            `Boolean comparison "${match[0]}" can be simplified`,
            "Prefer `WHERE flag` / `WHERE NOT flag` style predicates.",
            pos.line,
            pos.column,
          ),
        );
      }
    }
    return diagnostics;
  },
};
