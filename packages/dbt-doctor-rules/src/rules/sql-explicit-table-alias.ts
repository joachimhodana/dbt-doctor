import type { Diagnostic } from "@dbt-doctor/types";
import type { Rule } from "../types.js";
import { report } from "../utils/report.js";
import { offsetToLineColumn, parseSqlWithCst, walkCstWithPath } from "../utils/sql-cst.js";

export const sqlExplicitTableAlias: Rule = {
  id: "sql-explicit-table-alias",
  severity: "warn",
  category: "SQL Style",
  recommendation: "Use explicit AS for table/subquery aliases.",
  tags: ["style", "sql-style"],
  run: ({ sqlFiles, readFile, project }) => {
    const diagnostics: Diagnostic[] = [];

    for (const filePath of sqlFiles) {
      const content = readFile(filePath);
      const parsed = parseSqlWithCst(filePath, content, project.adapter);
      if (!parsed) continue;

      walkCstWithPath(parsed.cst, (node, path) => {
        if (node.type !== "alias" || !node.range) return;
        const aliasNode = node as {
          asKw?: { type?: string };
          alias?: { range?: [number, number] };
        };
        if (aliasNode.asKw) return;

        const inFromContext = path.some(
          (ancestor) => ancestor.type === "from_clause" || ancestor.type === "join_expr",
        );
        if (!inFromContext) return;

        const aliasRange = aliasNode.alias?.range;
        const position = offsetToLineColumn(content, aliasRange?.[0] ?? node.range[0]);
        diagnostics.push(
          report(
            sqlExplicitTableAlias,
            filePath,
            "Table alias should use explicit AS.",
            "Write aliases as `table AS alias` for clarity (SQLFluff aliasing.table style).",
            position.line,
            position.column,
          ),
        );
      });
    }

    return diagnostics;
  },
};
