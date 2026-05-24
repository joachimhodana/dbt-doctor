import type { Diagnostic } from "@dbt-doctor/types";
import type { Rule } from "../types.js";
import { report } from "../utils/report.js";
import { offsetToLineColumn, parseSqlWithCst, walkCstWithPath } from "../utils/sql-cst.js";

const CHECKED_OPERATORS = new Set(["=", "!=", "<>", ">", "<", ">=", "<=", "+", "-", "*", "/"]);

const hasSpace = (parts: unknown): boolean =>
  Array.isArray(parts) && parts.some((part) => (part as { type?: string }).type === "space");

export const sqlOperatorSpacing: Rule = {
  id: "sql-operator-spacing",
  severity: "warn",
  category: "SQL Style",
  recommendation: "Use single spaces around binary operators.",
  tags: ["style", "phase5"],
  run: ({ sqlFiles, readFile, project }) => {
    const diagnostics: Diagnostic[] = [];

    for (const filePath of sqlFiles) {
      const content = readFile(filePath);
      const parsed = parseSqlWithCst(filePath, content, project.adapter);
      if (!parsed) continue;

      walkCstWithPath(parsed.cst, (node) => {
        if (node.type !== "binary_expr") return;

        const expr = node as {
          operator?: string;
          left?: { trailing?: unknown; range?: [number, number] };
          right?: { leading?: unknown };
        };

        if (!expr.operator || !CHECKED_OPERATORS.has(expr.operator)) return;

        const hasLeftSpace = hasSpace(expr.left?.trailing);
        const hasRightSpace = hasSpace(expr.right?.leading);
        if (hasLeftSpace && hasRightSpace) return;

        const offset = expr.left?.range?.[1] ?? 0;
        const position = offsetToLineColumn(content, offset);
        diagnostics.push(
          report(
            sqlOperatorSpacing,
            filePath,
            `Operator \"${expr.operator}\" should be surrounded by spaces.`,
            "Use one space on both sides of binary operators (SQLFluff LT03 parity).",
            position.line,
            position.column,
          ),
        );
      });
    }

    return diagnostics;
  },
};
