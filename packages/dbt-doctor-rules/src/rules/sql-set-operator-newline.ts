import type { Rule } from "../types.js";
import { report } from "../utils/report.js";
import { offsetToLineColumn, parseSqlWithCst, walkCst } from "../utils/sql-cst.js";

const hasNewline = (chunk: string): boolean => /\r?\n/.test(chunk);

export const sqlSetOperatorNewline: Rule = {
  id: "sql-set-operator-newline",
  severity: "warn",
  category: "SQL Style",
  recommendation: "Place set operators (UNION/INTERSECT/EXCEPT) on their own line boundaries.",
  tags: ["style", "phase5"],
  run: ({ sqlFiles, readFile, project }) => {
    const diagnostics = [];

    for (const filePath of sqlFiles) {
      const content = readFile(filePath);
      const parsed = parseSqlWithCst(filePath, content, project.adapter);
      if (!parsed) continue;

      walkCst(parsed.cst, {
        compound_select_stmt: (node: {
          operator?: { range?: [number, number] } | Array<{ range?: [number, number] }>;
          left?: { range?: [number, number] };
          right?: { range?: [number, number] };
        }) => {
          const operators: Array<{ range?: [number, number] }> = [];
          if (node.operator) {
            if (Array.isArray(node.operator)) {
              operators.push(...node.operator);
            } else {
              operators.push(node.operator);
            }
          }
          const firstOperator = operators[0];
          const lastOperator = operators[operators.length - 1];
          if (!firstOperator?.range || !lastOperator?.range || !node.left?.range || !node.right?.range) return;

          const beforeOperator = content.slice(node.left.range[1], firstOperator.range[0]);
          const afterOperator = content.slice(lastOperator.range[1], node.right.range[0]);
          if (hasNewline(beforeOperator) && hasNewline(afterOperator)) return;

          const position = offsetToLineColumn(content, firstOperator.range[0]);
          diagnostics.push(
            report(
              sqlSetOperatorNewline,
              filePath,
              "Set operator should be separated by newlines.",
              "Put UNION/INTERSECT/EXCEPT between newline boundaries (SQLFluff LT11 parity).",
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
