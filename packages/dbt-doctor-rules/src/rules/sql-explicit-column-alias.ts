import type { Rule } from "../types.js";
import { report } from "../utils/report.js";
import { offsetToLineColumn, parseSqlWithCst, walkCstWithPath } from "../utils/sql-cst.js";

export const sqlExplicitColumnAlias: Rule = {
  id: "sql-explicit-column-alias",
  severity: "warn",
  category: "SQL Style",
  recommendation: "Use explicit AS for select-expression aliases.",
  tags: ["style", "phase5"],
  run: ({ sqlFiles, readFile, project }) => {
    const diagnostics = [];

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

        const inSelectClause = path.some((ancestor) => ancestor.type === "select_clause");
        if (!inSelectClause) return;

        const aliasRange = aliasNode.alias?.range;
        const position = offsetToLineColumn(content, aliasRange?.[0] ?? node.range[0]);
        diagnostics.push(
          report(
            sqlExplicitColumnAlias,
            filePath,
            "Column alias should use explicit AS.",
            "Write aliases as `expression AS alias` for clarity (SQLFluff aliasing.expression style).",
            position.line,
            position.column,
          ),
        );
      });
    }

    return diagnostics;
  },
};
