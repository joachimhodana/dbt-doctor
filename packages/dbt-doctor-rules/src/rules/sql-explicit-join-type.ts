import type { Diagnostic } from "@dbt-doctor/types";
import type { Rule } from "../types.js";
import { report } from "../utils/report.js";
import { offsetToLineColumn, parseSqlWithCst, walkCst } from "../utils/sql-cst.js";

export const sqlExplicitJoinType: Rule = {
  id: "sql-explicit-join-type",
  severity: "warn",
  category: "SQL Style",
  recommendation: "Use explicit JOIN type (e.g. INNER JOIN, LEFT JOIN).",
  tags: ["style", "sql-style"],
  run: ({ sqlFiles, readFile, project }) => {
    const diagnostics: Diagnostic[] = [];

    for (const filePath of sqlFiles) {
      const content = readFile(filePath);
      const parsed = parseSqlWithCst(filePath, content, project.adapter);
      if (!parsed) continue;

      walkCst(parsed.cst, {
        join_expr: (node: {
          operator?:
            | { type?: string; text?: string; range?: [number, number] }
            | Array<{ type?: string; text?: string; range?: [number, number] }>;
        }) => {
          const operator = node.operator;
          const first = Array.isArray(operator) ? operator[0] : operator;
          if (!first || first.type !== "keyword" || !first.text || !first.range) return;

          if (first.text.trim().toLowerCase() !== "join") return;
          const position = offsetToLineColumn(content, first.range[0]);
          diagnostics.push(
            report(
              sqlExplicitJoinType,
              filePath,
              "JOIN type is implicit.",
              "Use explicit join type (e.g. INNER JOIN) to avoid ambiguity (SQLFluff ambiguous.join style).",
              position.line,
              position.column,
            ),
          );
        },
      });
    }

    return diagnostics;
  },
};
