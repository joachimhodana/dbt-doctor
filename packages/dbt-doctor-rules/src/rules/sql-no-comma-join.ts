import type { Rule } from "../types.js";
import { offsetToLineColumn } from "../utils/sql-cst.js";
import { maskJinjaBlocks } from "../utils/jinja-sql-scan.js";
import { report } from "../utils/report.js";

const FROM_PATTERN = /\bfrom\b/gi;
const COMMA_TABLE_PATTERN = /,\s*[a-zA-Z_"`\[]/;

export const sqlNoCommaJoin: Rule = {
  id: "sql-no-comma-join",
  severity: "warn",
  category: "SQL Quality",
  tags: ["style", "sql-style"],
  recommendation: "Use explicit JOIN syntax instead of comma joins in FROM clauses.",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];

    for (const file of sqlFiles) {
      const content = maskJinjaBlocks(readFile(file));

      for (const match of content.matchAll(FROM_PATTERN)) {
        if (match.index === undefined) continue;
        const slice = content.slice(match.index, match.index + 240);
        const commaMatch = slice.match(COMMA_TABLE_PATTERN);
        if (!commaMatch || commaMatch.index === undefined) continue;

        const beforeComma = slice.slice(0, commaMatch.index);
        if (beforeComma.includes(")")) continue;

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
