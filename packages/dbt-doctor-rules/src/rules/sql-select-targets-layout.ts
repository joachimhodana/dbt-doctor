import type { Diagnostic } from "@dbt-doctor/types";
import type { Rule } from "../types.js";
import { report } from "../utils/report.js";
import { offsetToLineColumn, parseSqlWithCst, walkCst } from "../utils/sql-cst.js";

type SingleTargetPolicy = "same_line" | "new_line";
type WildcardPolicy = "single" | "multiple";

const resolveSingleTargetPolicy = (ruleConfig: Record<string, unknown>): SingleTargetPolicy => {
  const raw = ruleConfig.singleTargetPolicy;
  return raw === "new_line" ? "new_line" : "same_line";
};

const resolveWildcardPolicy = (ruleConfig: Record<string, unknown>): WildcardPolicy => {
  const raw = ruleConfig.wildcardPolicy;
  return raw === "multiple" ? "multiple" : "single";
};

const hasLeadingNewline = (node: { leading?: Array<{ type?: string }> } | undefined): boolean =>
  Boolean(node?.leading?.some((entry) => entry.type === "newline"));

export const sqlSelectTargetsLayout: Rule = {
  id: "sql-select-targets-layout",
  severity: "warn",
  category: "SQL Style",
  recommendation: "Format SELECT targets on new lines (SQLFluff layout.select_targets style).",
  tags: ["style", "phase5"],
  run: ({ sqlFiles, readFile, project, ruleConfig }) => {
    const diagnostics: Diagnostic[] = [];
    const singleTargetPolicy = resolveSingleTargetPolicy(ruleConfig);
    const wildcardPolicy = resolveWildcardPolicy(ruleConfig);

    for (const filePath of sqlFiles) {
      const content = readFile(filePath);
      const parsed = parseSqlWithCst(filePath, content, project.adapter);
      if (!parsed) continue;

      walkCst(parsed.cst, {
        select_clause: (node: {
          selectKw?: { range?: [number, number] };
          columns?: {
            items?: Array<{
              type?: string;
              range?: [number, number];
              leading?: Array<{ type?: string }>;
            }>;
          };
        }) => {
          const selectRange = node.selectKw?.range;
          const items = (node.columns?.items ?? []).filter((item) => item.type !== "empty");
          if (!selectRange || items.length === 0) return;

          const hasWildcard = items.some((item) => item.type === "all_columns");
          const effectiveItemCount =
            hasWildcard && wildcardPolicy === "multiple" ? 2 : items.length;
          const requireNewLine = effectiveItemCount > 1 || singleTargetPolicy === "new_line";
          if (!requireNewLine) return;

          const firstItem = items[0];
          if (!firstItem?.range) return;

          const selectLine = offsetToLineColumn(content, selectRange[0]).line;
          const firstItemLine = offsetToLineColumn(content, firstItem.range[0]).line;
          if (firstItemLine !== selectLine) return;
          if (hasLeadingNewline(firstItem)) return;

          const position = offsetToLineColumn(content, firstItem.range[0]);
          diagnostics.push(
            report(
              sqlSelectTargetsLayout,
              filePath,
              "SELECT targets should start on a new line.",
              "Place each select target on its own line (SQLFluff layout.select_targets compatible behavior).",
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
