import type { Rule } from "../types.js";
import { report } from "../utils/report.js";
import { parseSqlWithCst, walkCstWithPath } from "../utils/sql-cst.js";

const isFunctionName = (path: Array<{ type?: string }>, node: { type?: string }): boolean => {
  const parent = path[path.length - 1] as { type?: string; name?: unknown } | undefined;
  return parent?.type === "func_call" && parent.name === node;
};

export const sqlReferenceConsistency: Rule = {
  id: "sql-reference-consistency",
  severity: "warn",
  category: "SQL Style",
  recommendation: "Use a consistent reference style within a SELECT statement.",
  tags: ["style", "sql-style"],
  run: ({ sqlFiles, readFile, project }) => {
    const diagnostics = [];

    for (const filePath of sqlFiles) {
      const content = readFile(filePath);
      const parsed = parseSqlWithCst(filePath, content, project.adapter);
      if (!parsed) continue;

      let hasQualified = false;
      let hasUnqualified = false;

      walkCstWithPath(parsed.cst, (node, path) => {
        const inSelect = path.some((ancestor) => ancestor.type === "select_clause");
        if (!inSelect) return;

        if (node.type === "member_expr") {
          hasQualified = true;
          return;
        }

        if (node.type !== "identifier" || !node.range || !node.text) return;
        if (isFunctionName(path, node)) return;

        const parent = path[path.length - 1];
        if (parent?.type === "member_expr" || parent?.type === "alias") return;
        hasUnqualified = true;
      });

      if (!(hasQualified && hasUnqualified)) continue;
      diagnostics.push(
        report(
          sqlReferenceConsistency,
          filePath,
          "SELECT mixes qualified and unqualified column references.",
          "Use one reference style consistently within a query block (SQLFluff RF03 parity).",
        ),
      );
    }

    return diagnostics;
  },
};
