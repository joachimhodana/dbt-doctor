import type { Rule } from "../types.js";
import { offsetToLineColumn } from "../utils/sql-cst.js";
import { report } from "../utils/report.js";

const maskRanges = (content: string): string => {
  // Mask single-line comments, block comments, and quoted strings to avoid false positives.
  return content
    .replace(/--[^\n]*/g, (match) => " ".repeat(match.length))
    .replace(/\/\*[\s\S]*?\*\//g, (match) => " ".repeat(match.length))
    .replace(/'(?:''|[^'])*'/g, (match) => " ".repeat(match.length))
    .replace(/"(?:""|[^"])*"/g, (match) => " ".repeat(match.length));
};

export const sqlPreferBangEquals: Rule = {
  id: "sql-prefer-bang-equals",
  severity: "warn",
  category: "SQL Quality",
  tags: ["style", "sql-style"],
  recommendation: "Use != instead of <> for inequality to keep operator style consistent.",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];

    for (const file of sqlFiles) {
      const content = readFile(file);
      const masked = maskRanges(content);

      let searchIndex = 0;
      while (searchIndex < masked.length) {
        const index = masked.indexOf("<>", searchIndex);
        if (index < 0) break;

        const pos = offsetToLineColumn(content, index);
        diagnostics.push(
          report(
            sqlPreferBangEquals,
            file,
            'Use "!=" instead of "<>" for inequality',
            'Replace "<>" with "!=" to keep inequality operators consistent.',
            pos.line,
            pos.column,
          ),
        );

        searchIndex = index + 2;
      }
    }

    return diagnostics;
  },
};
