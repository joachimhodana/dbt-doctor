import type { Rule } from "../types.js";
import { report } from "../utils/report.js";

const RESERVED = new Set([
  "select",
  "from",
  "where",
  "join",
  "group",
  "order",
  "having",
  "limit",
  "and",
  "or",
  "case",
  "when",
  "then",
  "else",
  "end",
]);

const ALIAS_PATTERN = /\bas\s+([a-zA-Z_][\w$]*)\b/gi;

export const sqlAliasNotKeyword: Rule = {
  id: "sql-alias-not-keyword",
  severity: "warn",
  category: "SQL Style",
  recommendation: "Avoid SQL reserved words as aliases.",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      const content = readFile(file);
      for (const match of content.matchAll(ALIAS_PATTERN)) {
        const alias = (match[1] ?? "").toLowerCase();
        if (!RESERVED.has(alias)) continue;
        diagnostics.push(
          report(
            sqlAliasNotKeyword,
            file,
            `Alias "${match[1]}" uses a SQL keyword`,
            "Choose a non-keyword alias name.",
          ),
        );
      }
    }
    return diagnostics;
  },
};
