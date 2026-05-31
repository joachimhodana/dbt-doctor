import type { Rule } from "../types.js";
import { report } from "../utils/report.js";

const DISTINCT_ORDER_BY_PATTERN = /\bselect\s+distinct\b[\s\S]*?\border\s+by\s+([^;\n]+)/gi;

export const sqlDistinctWithOrderByNonSelected: Rule = {
  id: "sql-distinct-with-order-by-non-selected",
  severity: "warn",
  category: "SQL Quality",
  recommendation:
    "Avoid DISTINCT + ORDER BY columns that are not clearly part of selected outputs.",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      const content = readFile(file);
      for (const match of content.matchAll(DISTINCT_ORDER_BY_PATTERN)) {
        const orderExpr = (match[1] ?? "").trim();
        if (!orderExpr) continue;
        if (/^\d+$/u.test(orderExpr)) continue;
        diagnostics.push(
          report(
            sqlDistinctWithOrderByNonSelected,
            file,
            "DISTINCT query uses ORDER BY expression that may be non-selected/ambiguous",
            "Align ORDER BY with selected output columns in DISTINCT queries.",
          ),
        );
      }
    }
    return diagnostics;
  },
};
