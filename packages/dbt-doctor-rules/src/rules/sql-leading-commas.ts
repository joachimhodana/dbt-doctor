import type { Diagnostic } from "@dbt-doctor/types";
import type { Rule } from "../types.js";
import { report } from "../utils/report.js";
import { offsetToLineColumn, parseSqlWithCst, walkCst } from "../utils/sql-cst.js";

const isEnabled = (ruleConfig: Record<string, unknown>, defaultValue: boolean): boolean => {
  if (typeof ruleConfig.enabled === "boolean") return ruleConfig.enabled;
  return defaultValue;
};

const lineOfOffset = (sql: string, offset: number): number => offsetToLineColumn(sql, offset).line;

export const sqlLeadingCommas: Rule = {
  id: "sql-leading-commas",
  severity: "warn",
  category: "SQL Style",
  recommendation: "Use leading comma placement in comma-separated SQL lists.",
  tags: ["style", "sql-style"],
  run: ({ sqlFiles, readFile, project, ruleConfig }) => {
    if (!isEnabled(ruleConfig, false)) return [];

    const diagnostics: Diagnostic[] = [];

    for (const filePath of sqlFiles) {
      const content = readFile(filePath);
      const parsed = parseSqlWithCst(filePath, content, project.adapter);
      if (!parsed) continue;

      walkCst(parsed.cst, {
        list_expr: (node: { items?: Array<{ range?: [number, number] }> }) => {
          const items = node.items ?? [];
          for (let i = 0; i < items.length - 1; i += 1) {
            const current = items[i]?.range;
            const next = items[i + 1]?.range;
            if (!current || !next) continue;

            const separator = content.slice(current[1], next[0]);
            const commaRelativeIndex = separator.indexOf(",");
            if (commaRelativeIndex === -1) continue;

            const commaOffset = current[1] + commaRelativeIndex;
            const commaLine = lineOfOffset(content, commaOffset);
            const nextLine = lineOfOffset(content, next[0]);
            if (commaLine === nextLine) continue;

            const position = offsetToLineColumn(content, commaOffset);
            diagnostics.push(
              report(
                sqlLeadingCommas,
                filePath,
                "Comma should be leading (same line as next select target).",
                "Move the comma to the next line before the following expression to match SQLFluff layout.commas leading style.",
                position.line,
                position.column,
              ),
            );
          }
        },
      });
    }

    return diagnostics;
  },
};
