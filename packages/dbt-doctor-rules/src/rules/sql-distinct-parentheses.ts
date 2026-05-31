import type { Rule } from "../types.js";
import { report } from "../utils/report.js";

const DISTINCT_PARENS_PATTERN = /\bselect\s+distinct\s*\(/gi;

export const sqlDistinctParentheses: Rule = {
  id: "sql-distinct-parentheses",
  severity: "warn",
  category: "SQL Style",
  tags: ["style", "sql-style"],
  recommendation: "Avoid DISTINCT wrapped in parentheses.",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      const content = readFile(file);
      for (const _ of content.matchAll(DISTINCT_PARENS_PATTERN)) {
        diagnostics.push(
          report(
            sqlDistinctParentheses,
            file,
            "DISTINCT used with parentheses",
            "Use `SELECT DISTINCT col` instead of `SELECT DISTINCT(col)`.",
          ),
        );
      }
    }
    return diagnostics;
  },
};
