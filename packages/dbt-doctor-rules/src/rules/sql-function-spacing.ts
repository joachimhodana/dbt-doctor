import type { Diagnostic } from "@dbt-doctor/types";
import type { Rule } from "../types.js";
import { report } from "../utils/report.js";
import { offsetToLineColumn, parseSqlWithCst, walkCst } from "../utils/sql-cst.js";

const hasSpace = (parts: unknown): boolean =>
  Array.isArray(parts) && parts.some((part) => (part as { type?: string }).type === "space");

export const sqlFunctionSpacing: Rule = {
  id: "sql-function-spacing",
  severity: "warn",
  category: "SQL Style",
  recommendation: "Do not add whitespace between function names and parentheses.",
  tags: ["style", "sql-style"],
  run: ({ sqlFiles, readFile, project }) => {
    const diagnostics: Diagnostic[] = [];

    for (const filePath of sqlFiles) {
      const content = readFile(filePath);
      const parsed = parseSqlWithCst(filePath, content, project.adapter);
      if (!parsed) continue;

      walkCst(parsed.cst, {
        func_call: (node: {
          name?: { trailing?: unknown; range?: [number, number]; text?: string };
        }) => {
          const name = node.name;
          if (!name?.range || !name.text) return;
          if (!hasSpace(name.trailing)) return;

          const position = offsetToLineColumn(content, name.range[1]);
          diagnostics.push(
            report(
              sqlFunctionSpacing,
              filePath,
              `Function \"${name.text}\" has whitespace before parentheses.`,
              'Write function calls without whitespace before "(" (SQLFluff LT06 parity).',
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
