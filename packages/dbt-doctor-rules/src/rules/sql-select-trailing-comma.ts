import type { Diagnostic } from "@dbt-doctor/types";
import type { Rule } from "../types.js";
import { report } from "../utils/report.js";
import { offsetToLineColumn, parseSqlWithCst, walkCst } from "../utils/sql-cst.js";

const isEnabled = (ruleConfig: Record<string, unknown>, defaultValue: boolean): boolean => {
  if (typeof ruleConfig.enabled === "boolean") return ruleConfig.enabled;
  return defaultValue;
};

export const sqlSelectTrailingComma: Rule = {
  id: "sql-select-trailing-comma",
  severity: "warn",
  category: "SQL Style",
  recommendation: "Disallow trailing commas at end of SELECT lists (SQLFluff CV03 default).",
  tags: ["style", "phase5"],
  run: ({ sqlFiles, readFile, project, ruleConfig }) => {
    if (!isEnabled(ruleConfig, true)) return [];

    const diagnostics: Diagnostic[] = [];

    for (const filePath of sqlFiles) {
      const content = readFile(filePath);
      const parsed = parseSqlWithCst(filePath, content, project.adapter);
      if (!parsed) continue;

      walkCst(parsed.cst, {
        select_clause: (node: { columns?: { items?: Array<{ type?: string; range?: [number, number] }> } }) => {
          const items = node.columns?.items ?? [];
          if (items.length < 2) return;

          const last = items[items.length - 1];
          const penultimate = items[items.length - 2];
          if (!last || !penultimate?.range) return;
          if (last.type !== "empty") return;

          const position = offsetToLineColumn(content, penultimate.range[1]);
          diagnostics.push(
            report(
              sqlSelectTrailingComma,
              filePath,
              "Trailing comma in SELECT clause is not allowed.",
              "Remove the final trailing comma in the SELECT list (SQLFluff convention.select_trailing_comma default behavior).",
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
