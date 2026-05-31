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

const detectCase = (text: string): SqlCasePolicy | null => {
  if (text.length === 0) return null;
  if (isUpperCase(text)) return "upper";
  if (isLowerCase(text)) return "lower";
  return null;
};

export const sqlFunctionNameCase: Rule = {
  id: "sql-function-name-case",
  severity: "warn",
  category: "SQL Style",
  recommendation: "Use consistent capitalization for SQL function names.",
  tags: ["style", "sql-style"],
  run: ({ sqlFiles, readFile, project, ruleConfig }) => {
    const diagnostics = [];
    const configuredPolicy = resolveSqlCasePolicy(ruleConfig);

    for (const filePath of sqlFiles) {
      const content = readFile(filePath);
      const parsed = parseSqlWithCst(filePath, content, project.adapter);
      if (!parsed) continue;

      const functions: Array<{ text: string; offset: number }> = [];
      let inferredPolicy: SqlCasePolicy | null = null;

      walkCst(parsed.cst, {
        func_call: (node: { name?: { text?: string; range?: [number, number] } }) => {
          const name = node.name?.text;
          const range = node.name?.range;
          if (!name || !range) return;

          const shape = detectCase(name);
          if (!shape) return;
          functions.push({ text: name, offset: range[0] });

          if (configuredPolicy === "consistent" && inferredPolicy === null) {
            inferredPolicy = shape;
          }
        },
      });

      const effectivePolicy =
        configuredPolicy === "consistent" ? (inferredPolicy ?? "upper") : configuredPolicy;
      for (const fn of functions) {
        if (matchesSqlCasePolicy(fn.text, effectivePolicy)) continue;

        const position = offsetToLineColumn(content, fn.offset);
        diagnostics.push(
          report(
            sqlFunctionNameCase,
            filePath,
            `Function name \"${fn.text}\" is not ${effectivePolicy}.`,
            `Use ${effectivePolicy} function naming consistently (SQLFluff capitalisation.functions style).`,
            position.line,
            position.column,
          ),
        );
      }
    }

    return diagnostics;
  },
};
