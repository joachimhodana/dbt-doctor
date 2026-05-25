import type { Rule } from "../types.js";
import { report } from "../utils/report.js";

const DISTINCT_QUERY_PATTERN = /\bselect\s+distinct\s+([\s\S]*?)\bfrom\b[\s\S]*?\border\s+by\s+([^;\n]+)/gi;

const normalizeExpr = (expr: string): string => expr.replace(/\s+/g, " ").trim().toLowerCase();

export const sqlOrderByDistinctCompatibility: Rule = {
  id: "sql-order-by-distinct-compatibility",
  severity: "warn",
  category: "SQL Quality",
  recommendation: "In DISTINCT queries, ORDER BY expressions should be selected or positional.",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      const content = readFile(file);
      for (const match of content.matchAll(DISTINCT_QUERY_PATTERN)) {
        const selected = (match[1] ?? "")
          .split(",")
          .map((part) => normalizeExpr(part.split(/\bas\b/i)[0] ?? part))
          .filter(Boolean);
        const orderExpr = normalizeExpr(match[2] ?? "");
        if (!orderExpr) continue;
        if (/^\d+$/u.test(orderExpr)) continue;
        if (selected.includes(orderExpr)) continue;
        diagnostics.push(
          report(
            sqlOrderByDistinctCompatibility,
            file,
            "ORDER BY expression is not clearly part of DISTINCT select list",
            "Use selected/aliased columns (or positional index) in ORDER BY for DISTINCT queries.",
          ),
        );
      }
    }
    return diagnostics;
  },
};
