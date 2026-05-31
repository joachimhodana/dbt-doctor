import type { Rule } from "../types.js";
import { report } from "../utils/report.js";

const ORDER_BY_ORDINAL_PATTERN = /\border\s+by\s+(\d+)\b/gi;

export const sqlOrderByOrdinalUnambiguous: Rule = {
  id: "sql-order-by-ordinal-unambiguous",
  severity: "warn",
  category: "SQL Quality",
  tags: ["style", "sql-style"],
  recommendation: "Avoid ordinal ORDER BY references in complex queries.",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      const content = readFile(file);
      for (const match of content.matchAll(ORDER_BY_ORDINAL_PATTERN)) {
        diagnostics.push(
          report(
            sqlOrderByOrdinalUnambiguous,
            file,
            `Ordinal ORDER BY target "${match[1]}" detected`,
            "Use explicit column/alias names in ORDER BY.",
          ),
        );
      }
    }
    return diagnostics;
  },
};
