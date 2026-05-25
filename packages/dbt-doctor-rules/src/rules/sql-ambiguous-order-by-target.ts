import type { Rule } from "../types.js";
import { offsetToLineColumn } from "../utils/sql-cst.js";
import { report } from "../utils/report.js";

const ORDER_BY_ALIAS_PATTERN = /\border\s+by\s+([a-zA-Z_][\w$]*)\b/gi;

export const sqlAmbiguousOrderByTarget: Rule = {
  id: "sql-ambiguous-order-by-target",
  severity: "warn",
  category: "SQL Quality",
  recommendation: "Avoid ambiguous ORDER BY targets that can resolve to multiple expressions.",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];

    for (const file of sqlFiles) {
      const content = readFile(file);
      for (const match of content.matchAll(ORDER_BY_ALIAS_PATTERN)) {
        if (match.index === undefined) continue;
        const target = match[1] ?? "";
        const duplicateAliasCount = (content.match(new RegExp(`\\bas\\s+${target}\\b`, "gi")) ?? [])
          .length;
        if (duplicateAliasCount <= 1) continue;

        const pos = offsetToLineColumn(content, match.index);
        diagnostics.push(
          report(
            sqlAmbiguousOrderByTarget,
            file,
            `ORDER BY target "${target}" is ambiguous`,
            "Use an explicit qualified/unique expression in ORDER BY.",
            pos.line,
            pos.column,
          ),
        );
      }
    }

    return diagnostics;
  },
};
