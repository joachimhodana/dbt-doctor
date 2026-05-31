import type { Rule } from "../types.js";
import { offsetToLineColumn } from "../utils/sql-cst.js";
import { report } from "../utils/report.js";

const COMMA_JOIN_PATTERN = /\bfrom\b[\s\S]{0,240}?,\s*[a-zA-Z_"`\[]/gi;

export const sqlNoCommaJoin: Rule = {
  id: "sql-no-comma-join",
  severity: "warn",
  category: "SQL Quality",
  tags: ["style", "sql-style"],
  recommendation: "Use explicit JOIN syntax instead of comma joins in FROM clauses.",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];

    for (const file of sqlFiles) {
      const content = readFile(file);
      for (const match of content.matchAll(COMMA_JOIN_PATTERN)) {
        if (match.index === undefined) continue;
        const position = offsetToLineColumn(content, match.index);
        diagnostics.push(
          report(
            sqlNoCommaJoin,
            file,
            "Implicit comma join detected in FROM clause",
            "Replace comma joins with explicit JOIN ... ON/USING syntax.",
            position.line,
            position.column,
          ),
        );
      }
    }

    return diagnostics;
  },
};
