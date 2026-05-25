import type { Rule } from "../types.js";
import { offsetToLineColumn } from "../utils/sql-cst.js";
import { report } from "../utils/report.js";

const ELSE_NULL_CASE_PATTERN = /\bcase\b[\s\S]*?\belse\s+null\b[\s\S]*?\bend\b/gi;

export const sqlNoElseNullCase: Rule = {
  id: "sql-no-else-null-case",
  severity: "warn",
  category: "SQL Style",
  recommendation: "Avoid redundant ELSE NULL in CASE expressions.",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      const content = readFile(file);
      for (const match of content.matchAll(ELSE_NULL_CASE_PATTERN)) {
        if (match.index === undefined) continue;
        const pos = offsetToLineColumn(content, match.index);
        diagnostics.push(
          report(
            sqlNoElseNullCase,
            file,
            "CASE expression includes redundant ELSE NULL",
            "Drop ELSE NULL unless required for explicitness in your team standard.",
            pos.line,
            pos.column,
          ),
        );
      }
    }
    return diagnostics;
  },
};
