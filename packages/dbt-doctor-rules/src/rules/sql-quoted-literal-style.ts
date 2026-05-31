import type { Rule } from "../types.js";
import { offsetToLineColumn } from "../utils/sql-cst.js";
import { report } from "../utils/report.js";

const DOUBLE_QUOTED_STRING_PATTERN = /"[^"\n]*"/g;

export const sqlQuotedLiteralStyle: Rule = {
  id: "sql-quoted-literal-style",
  severity: "warn",
  category: "SQL Style",
  tags: ["style", "sql-style"],
  recommendation: "Use single quotes for string literals.",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      const content = readFile(file);
      for (const match of content.matchAll(DOUBLE_QUOTED_STRING_PATTERN)) {
        if (match.index === undefined) continue;
        const value = match[0] ?? "";
        if (/^"[A-Za-z_][\w$]*"$/.test(value)) continue;

        const pos = offsetToLineColumn(content, match.index);
        diagnostics.push(
          report(
            sqlQuotedLiteralStyle,
            file,
            "Double-quoted string literal detected",
            "Use single-quoted string literals and reserve double quotes for identifiers.",
            pos.line,
            pos.column,
          ),
        );
      }
    }
    return diagnostics;
  },
};
