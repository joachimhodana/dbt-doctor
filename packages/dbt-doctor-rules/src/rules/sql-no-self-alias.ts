import type { Rule } from "../types.js";
import { offsetToLineColumn } from "../utils/sql-cst.js";
import { report } from "../utils/report.js";

const SELF_ALIAS_PATTERN = /\b([a-zA-Z_][\w$]*)\s+as\s+\1\b/gi;

export const sqlNoSelfAlias: Rule = {
  id: "sql-no-self-alias",
  severity: "warn",
  category: "SQL Style",
  tags: ["style", "sql-style"],
  recommendation: "Avoid redundant self-aliasing like `col AS col`.",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      const content = readFile(file);
      for (const match of content.matchAll(SELF_ALIAS_PATTERN)) {
        if (match.index === undefined) continue;
        const pos = offsetToLineColumn(content, match.index);
        diagnostics.push(
          report(
            sqlNoSelfAlias,
            file,
            `Redundant self-alias "${match[0]}"`,
            "Drop the alias or use a different target alias.",
            pos.line,
            pos.column,
          ),
        );
      }
    }
    return diagnostics;
  },
};
