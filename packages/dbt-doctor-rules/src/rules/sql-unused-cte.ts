import type { Rule } from "../types.js";
import { report } from "../utils/report.js";
import { offsetToLineColumn, parseSqlWithCst, walkCstWithPath } from "../utils/sql-cst.js";

const isCteDefinitionNode = (path: Array<{ type?: string }>, node: { type?: string }): boolean => {
  const parent = path[path.length - 1] as { type?: string; table?: unknown } | undefined;
  return parent?.type === "common_table_expr" && parent.table === node;
};

export const sqlUnusedCte: Rule = {
  id: "sql-unused-cte",
  severity: "warn",
  category: "SQL Style",
  recommendation: "Remove CTEs that are defined but never referenced.",
  tags: ["style", "phase5"],
  run: ({ sqlFiles, readFile, project }) => {
    const diagnostics = [];

    for (const filePath of sqlFiles) {
      const content = readFile(filePath);
      const parsed = parseSqlWithCst(filePath, content, project.adapter);
      if (!parsed) continue;

      const cteDefinitions = new Map<string, number>();
      const cteReferences = new Set<string>();

      walkCstWithPath(parsed.cst, (node, path) => {
        if (node.type !== "identifier") return;

        const identifier = node as { text?: string; range?: [number, number] };
        if (!identifier.text || !identifier.range) return;

        const normalized = identifier.text.toLowerCase();
        if (isCteDefinitionNode(path, node)) {
          cteDefinitions.set(normalized, identifier.range[0]);
          return;
        }

        if (cteDefinitions.has(normalized)) {
          cteReferences.add(normalized);
        }
      });

      for (const [cteName, offset] of cteDefinitions.entries()) {
        if (cteReferences.has(cteName)) continue;
        const position = offsetToLineColumn(content, offset);
        diagnostics.push(
          report(
            sqlUnusedCte,
            filePath,
            `CTE \"${cteName}\" is defined but never referenced.`,
            "Remove dead CTEs to keep SQL readable (SQLFluff ST03 parity).",
            position.line,
            position.column,
          ),
        );
      }
    }

    return diagnostics;
  },
};
