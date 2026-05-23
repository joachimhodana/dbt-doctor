import type { Rule } from "../types.js";
import { report } from "../utils/report.js";
import { offsetToLineColumn, parseSqlWithCst, walkCst } from "../utils/sql-cst.js";

const requireExplicitQualifier = (ruleConfig: Record<string, unknown>): boolean => {
  if (typeof ruleConfig.requireExplicitQualifier === "boolean") {
    return ruleConfig.requireExplicitQualifier;
  }
  return true;
};

export const sqlUnionExplicitQualifier: Rule = {
  id: "sql-union-explicit-qualifier",
  severity: "warn",
  category: "SQL Style",
  recommendation: "Use explicit UNION qualifier (UNION DISTINCT or UNION ALL).",
  tags: ["style", "phase5"],
  run: ({ sqlFiles, readFile, project, ruleConfig }) => {
    if (!requireExplicitQualifier(ruleConfig)) return [];

    const diagnostics = [];

    for (const filePath of sqlFiles) {
      const content = readFile(filePath);
      const parsed = parseSqlWithCst(filePath, content, project.adapter);
      if (!parsed) continue;

      walkCst(parsed.cst, {
        compound_select_stmt: (node: {
          operator?: { type?: string; text?: string; range?: [number, number] } | Array<{ type?: string; text?: string; range?: [number, number] }>;
        }) => {
          const operator = node.operator;
          const parts = Array.isArray(operator) ? operator : operator ? [operator] : [];
          if (parts.length === 0) return;

          const unionKeyword = parts.find((part) => part.type === "keyword" && part.text?.toLowerCase() === "union");
          if (!unionKeyword?.range) return;

          const hasQualifier = parts.some((part) => {
            const normalized = part.text?.toLowerCase();
            return normalized === "all" || normalized === "distinct";
          });
          if (hasQualifier) return;

          const position = offsetToLineColumn(content, unionKeyword.range[0]);
          diagnostics.push(
            report(
              sqlUnionExplicitQualifier,
              filePath,
              "UNION is missing explicit qualifier.",
              "Use UNION ALL or UNION DISTINCT explicitly (SQLFluff ambiguous.union style).",
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
