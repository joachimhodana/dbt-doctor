import type { Rule } from "../types.js";
import { stripLineComments } from "../utils/jinja-sql-scan.js";
import { report } from "../utils/report.js";

const CLAUSE_PATTERN = /\b(from|where|group\s+by|having|order\s+by|limit)\b/gi;

const hasContentBeforeIndex = (line: string, index: number): boolean =>
  line.slice(0, index).trim().length > 0;

export const sqlClauseNewlineConsistency: Rule = {
  id: "sql-clause-newline-consistency",
  severity: "warn",
  category: "SQL Style",
  tags: ["style", "sql-style"],
  recommendation: "Place major clauses on their own lines for consistent query layout.",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];

    for (const file of sqlFiles) {
      const lines = readFile(file).split(/\r?\n/u);

      for (let i = 0; i < lines.length; i += 1) {
        const line = stripLineComments(lines[i] ?? "");
        for (const match of line.matchAll(CLAUSE_PATTERN)) {
          if (match.index === undefined) continue;
          if (!hasContentBeforeIndex(line, match.index)) continue;

          const clause = match[1]?.toUpperCase() ?? "CLAUSE";
          diagnostics.push(
            report(
              sqlClauseNewlineConsistency,
              file,
              `${clause} should begin on a new line`,
              "Move each major clause (FROM/WHERE/GROUP BY/HAVING/ORDER BY/LIMIT) to its own line.",
              i + 1,
              match.index + 1,
            ),
          );
        }
      }
    }

    return diagnostics;
  },
};
