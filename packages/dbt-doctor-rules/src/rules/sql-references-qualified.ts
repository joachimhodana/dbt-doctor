import type { Rule } from "../types.js";
import { report } from "../utils/report.js";
import { offsetToLineColumn, parseSqlWithCst, walkCstWithPath } from "../utils/sql-cst.js";

const isFromOrJoinAliasIdentifier = (path: Array<{ type?: string }>, node: { type?: string }): boolean => {
  const parent = path[path.length - 1] as { type?: string; alias?: unknown; expr?: unknown } | undefined;
  if (parent?.type === "alias" && (parent.alias === node || parent.expr === node)) return true;
  return path.some((ancestor) => ancestor.type === "from_clause" || ancestor.type === "join_expr");
};

const isFunctionName = (path: Array<{ type?: string }>, node: { type?: string }): boolean => {
  const parent = path[path.length - 1] as { type?: string; name?: unknown } | undefined;
  return parent?.type === "func_call" && parent.name === node;
};

export const sqlReferencesQualified: Rule = {
  id: "sql-references-qualified",
  severity: "warn",
  category: "SQL Style",
  recommendation: "Qualify references when selecting from multiple relations.",
  tags: ["style", "phase5"],
  run: ({ sqlFiles, readFile, project }) => {
    const diagnostics = [];

    for (const filePath of sqlFiles) {
      const content = readFile(filePath);
      const parsed = parseSqlWithCst(filePath, content, project.adapter);
      if (!parsed) continue;

      let hasJoin = false;
      const bareIdentifiers: Array<{ text: string; offset: number }> = [];

      walkCstWithPath(parsed.cst, (node, path) => {
        if (node.type === "join_expr") hasJoin = true;
        if (node.type !== "identifier" || !node.range || !node.text) return;

        if (isFromOrJoinAliasIdentifier(path, node)) return;
        if (isFunctionName(path, node)) return;

        const parent = path[path.length - 1];
        if (parent?.type === "member_expr") return;

        const inRelevantClause = path.some((ancestor) =>
          ancestor.type === "select_clause" ||
          ancestor.type === "where_clause" ||
          ancestor.type === "group_by_clause" ||
          ancestor.type === "having_clause" ||
          ancestor.type === "order_by_clause",
        );
        if (!inRelevantClause) return;

        bareIdentifiers.push({ text: node.text, offset: node.range[0] });
      });

      if (!hasJoin) continue;
      for (const identifier of bareIdentifiers) {
        const position = offsetToLineColumn(content, identifier.offset);
        diagnostics.push(
          report(
            sqlReferencesQualified,
            filePath,
            `Reference "${identifier.text}" should be qualified with a table alias.`,
            "When multiple relations are present, prefer `alias.column` references (SQLFluff RF02 parity).",
            position.line,
            position.column,
          ),
        );
      }
    }

    return diagnostics;
  },
};
