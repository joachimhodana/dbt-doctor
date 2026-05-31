import type { Rule } from "../types.js";
import { offsetToLineColumn } from "../utils/sql-cst.js";
import { report } from "../utils/report.js";

const FROM_JOIN_ALIAS_PATTERN =
  /\b(?:from|join)\s+(?!\()(?:(?:\{\{[\s\S]*?\}\})|(?:[`"\[]?[a-zA-Z_][\w$]*[`"\]]?(?:\.[`"\[]?[a-zA-Z_][\w$]*[`"\]]?){0,2}))\s+(?:as\s+)?([a-zA-Z_][\w$]*)/gi;

export const sqlUniqueTableAliases: Rule = {
  id: "sql-unique-table-aliases",
  severity: "warn",
  category: "SQL Style",
  recommendation: "Use unique table aliases within a query block.",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];

    for (const file of sqlFiles) {
      const content = readFile(file);
      const seen = new Map<string, number>();

      for (const match of content.matchAll(FROM_JOIN_ALIAS_PATTERN)) {
        if (match.index === undefined) continue;
        const alias = (match[1] ?? "").toLowerCase();
        if (!alias) continue;

        const prev = seen.get(alias);
        if (prev === undefined) {
          seen.set(alias, match.index);
          continue;
        }

        const position = offsetToLineColumn(content, match.index);
        diagnostics.push(
          report(
            sqlUniqueTableAliases,
            file,
            `Duplicate table alias "${alias}" in FROM/JOIN clauses`,
            "Rename one alias so every relation alias is unique within the query.",
            position.line,
            position.column,
          ),
        );
      }
    }

    return diagnostics;
  },
};
