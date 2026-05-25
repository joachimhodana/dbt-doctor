import type { Rule } from "../types.js";
import { report } from "../utils/report.js";

const CONSECUTIVE_SEMICOLON_PATTERN = /;\s*;/g;

export const sqlNoConsecutiveSemicolons: Rule = {
  id: "sql-no-consecutive-semicolons",
  severity: "warn",
  category: "SQL Style",
  recommendation: "Avoid consecutive empty statement separators.",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      const content = readFile(file);
      for (const _ of content.matchAll(CONSECUTIVE_SEMICOLON_PATTERN)) {
        diagnostics.push(
          report(
            sqlNoConsecutiveSemicolons,
            file,
            "Consecutive semicolons detected",
            "Remove empty SQL statements created by repeated semicolons.",
          ),
        );
      }
    }
    return diagnostics;
  },
};
