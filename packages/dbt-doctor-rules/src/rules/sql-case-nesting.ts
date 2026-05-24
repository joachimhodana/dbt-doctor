import type { Diagnostic } from "@dbt-doctor/types";
import type { Rule } from "../types.js";
import { report } from "../utils/report.js";
import { offsetToLineColumn, parseSqlWithCst, walkCstWithPath } from "../utils/sql-cst.js";

export const sqlCaseNesting: Rule = {
  id: "sql-case-nesting",
  severity: "warn",
  category: "SQL Style",
  recommendation: "Avoid nested CASE expressions where possible.",
  tags: ["style", "phase5"],
  run: ({ sqlFiles, readFile, project }) => {
    const diagnostics: Diagnostic[] = [];

    for (const filePath of sqlFiles) {
      const content = readFile(filePath);
      const parsed = parseSqlWithCst(filePath, content, project.adapter);
      if (!parsed) continue;

      walkCstWithPath(parsed.cst, (node, path) => {
        if (node.type !== "case_expr" || !node.range) return;

        const isNested = path.some((ancestor) => ancestor.type === "case_expr");
        if (!isNested) return;

        const position = offsetToLineColumn(content, node.range[0]);
        diagnostics.push(
          report(
            sqlCaseNesting,
            filePath,
            "Nested CASE expression detected.",
            "Flatten nested CASE logic when possible for readability (SQLFluff ST04 parity).",
            position.line,
            position.column,
          ),
        );
      });
    }

    return diagnostics;
  },
};
