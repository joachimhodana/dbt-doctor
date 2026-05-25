import type { Rule } from "../types.js";
import { report } from "../utils/report.js";
import { offsetToLineColumn, parseSqlWithCst, walkCst } from "../utils/sql-cst.js";
import {
  isLowerCase,
  isUpperCase,
  matchesSqlCasePolicy,
  resolveSqlCasePolicy,
  type SqlCasePolicy,
} from "../utils/sql-case-policy.js";

const TARGET_KEYWORDS = new Set(["true", "false", "null"]);

const detectCase = (text: string): SqlCasePolicy | null => {
  if (text.length === 0) return null;
  if (isUpperCase(text)) return "upper";
  if (isLowerCase(text)) return "lower";
  return null;
};

export const sqlBooleanNullCase: Rule = {
  id: "sql-boolean-null-case",
  severity: "warn",
  category: "SQL Style",
  recommendation: "Use consistent capitalization for TRUE/FALSE/NULL literals.",
  tags: ["style", "sql-style"],
  run: ({ sqlFiles, readFile, project, ruleConfig }) => {
    const diagnostics = [];
    const configuredPolicy = resolveSqlCasePolicy(ruleConfig, "upper");

    for (const filePath of sqlFiles) {
      const content = readFile(filePath);
      const parsed = parseSqlWithCst(filePath, content, project.adapter);
      if (!parsed) continue;

      const keywords: Array<{ text: string; offset: number }> = [];
      let inferredPolicy: SqlCasePolicy | null = null;

      walkCst(parsed.cst, {
        keyword: (node: { text?: string; range?: [number, number] }) => {
          const text = node.text;
          const range = node.range;
          if (!text || !range) return;
          if (!TARGET_KEYWORDS.has(text.toLowerCase())) return;

          const shape = detectCase(text);
          if (!shape) return;
          keywords.push({ text, offset: range[0] });

          if (configuredPolicy === "consistent" && inferredPolicy === null) {
            inferredPolicy = shape;
          }
        },
      });

      const effectivePolicy =
        configuredPolicy === "consistent" ? (inferredPolicy ?? "upper") : configuredPolicy;
      for (const keyword of keywords) {
        if (matchesSqlCasePolicy(keyword.text, effectivePolicy)) continue;
        const position = offsetToLineColumn(content, keyword.offset);

        diagnostics.push(
          report(
            sqlBooleanNullCase,
            filePath,
            `Keyword \"${keyword.text}\" is not ${effectivePolicy}.`,
            `Use ${effectivePolicy} capitalization for TRUE/FALSE/NULL literals (SQLFluff CP04 parity).`,
            position.line,
            position.column,
          ),
        );
      }
    }

    return diagnostics;
  },
};
