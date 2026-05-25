import type { Rule } from "../types.js";
import { offsetToLineColumn } from "../utils/sql-cst.js";
import { report } from "../utils/report.js";

const UNION_DISTINCT_PATTERN = /\bunion\s+distinct\b/gi;

export const sqlUnionDistinctRedundant: Rule = {
  id: "sql-union-distinct-redundant",
  severity: "warn",
  category: "SQL Quality",
  recommendation: "Use UNION (default distinct) or UNION ALL; avoid redundant UNION DISTINCT.",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];

    for (const file of sqlFiles) {
      const content = readFile(file);

      for (const match of content.matchAll(UNION_DISTINCT_PATTERN)) {
        if (match.index === undefined) continue;
        const position = offsetToLineColumn(content, match.index);
        diagnostics.push(
          report(
            sqlUnionDistinctRedundant,
            file,
            "UNION DISTINCT is redundant",
            "Replace UNION DISTINCT with UNION, or use UNION ALL when duplicates are intended.",
            position.line,
            position.column,
          ),
        );
      }
    }

    return diagnostics;
  },
};
