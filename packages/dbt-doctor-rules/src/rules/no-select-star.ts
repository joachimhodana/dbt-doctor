import type { Rule } from "../types.js";
import { report } from "../utils/report.js";
import { offsetToLineColumn, parseSqlWithCst, walkCstWithPath } from "../utils/sql-cst.js";

export const noSelectStar: Rule = {
  id: "no-select-star",
  severity: "error",
  category: "SQL Quality",
  recommendation: "List columns explicitly instead of SELECT *",
  run: ({ sqlFiles, readFile, project }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      const content = readFile(file);
      const parsed = parseSqlWithCst(file, content, project.adapter);
      if (!parsed) continue;

      let hasSelectStar = false;
      let firstOffset = 0;
      walkCstWithPath(parsed.cst, (node, path) => {
        if (node.type !== "all_columns" || !node.range) return;
        const inFunctionArgs = path.some((ancestor) => ancestor.type === "func_args");
        if (inFunctionArgs) return;
        const inSelectClause = path.some((ancestor) => ancestor.type === "select_clause");
        if (!inSelectClause) return;
        hasSelectStar = true;
        firstOffset = node.range[0];
      });

      if (!hasSelectStar) continue;
      const position = offsetToLineColumn(content, firstOffset);
      diagnostics.push(
        report(
          noSelectStar,
          file,
          "Avoid SELECT * in dbt models",
          "List columns explicitly for stable contracts and clearer lineage.",
          position.line,
          position.column,
        ),
      );
    }
    return diagnostics;
  },
};
