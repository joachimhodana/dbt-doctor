import type { Diagnostic } from "@dbt-doctor/types";
import type { Rule } from "../types.js";
import { report } from "../utils/report.js";
import { offsetToLineColumn, parseSqlWithCst, walkCst } from "../utils/sql-cst.js";

export const sqlOrderByDirectionConsistency: Rule = {
  id: "sql-order-by-direction-consistency",
  severity: "warn",
  category: "SQL Style",
  recommendation: "Use consistent explicit ASC/DESC in ORDER BY lists.",
  tags: ["style", "phase5"],
  run: ({ sqlFiles, readFile, project }) => {
    const diagnostics: Diagnostic[] = [];

    for (const filePath of sqlFiles) {
      const content = readFile(filePath);
      const parsed = parseSqlWithCst(filePath, content, project.adapter);
      if (!parsed) continue;

      walkCst(parsed.cst, {
        order_by_clause: (node: {
          specifications?: {
            items?: Array<{ type?: string; range?: [number, number]; direction?: unknown }>;
          };
        }) => {
          const items = node.specifications?.items ?? [];
          if (items.length < 2) return;

          const hasExplicit = items.some(
            (item) => item.type === "sort_specification" && item.direction !== undefined,
          );
          if (!hasExplicit) return;

          for (const item of items) {
            const isExplicit = item.type === "sort_specification" && item.direction !== undefined;
            if (isExplicit || !item.range) continue;

            const position = offsetToLineColumn(content, item.range[0]);
            diagnostics.push(
              report(
                sqlOrderByDirectionConsistency,
                filePath,
                "ORDER BY direction is implicit while other terms are explicit.",
                "Specify ASC/DESC for all ORDER BY expressions for consistency (SQLFluff ambiguous.order_by style).",
                position.line,
                position.column,
              ),
            );
          }
        },
      });
    }

    return diagnostics;
  },
};
