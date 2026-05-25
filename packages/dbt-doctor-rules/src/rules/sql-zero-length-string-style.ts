import type { Rule } from "../types.js";
import { report } from "../utils/report.js";

const EMPTY_STRING_COMPARISON_PATTERN = /(?:=|!=|<>)\s*''/gi;

export const sqlZeroLengthStringStyle: Rule = {
  id: "sql-zero-length-string-style",
  severity: "warn",
  category: "SQL Convention",
  recommendation: "Handle zero-length strings explicitly and consistently.",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      const content = readFile(file);
      for (const _ of content.matchAll(EMPTY_STRING_COMPARISON_PATTERN)) {
        diagnostics.push(
          report(
            sqlZeroLengthStringStyle,
            file,
            "Direct empty-string comparison detected",
            "Prefer explicit normalization (for example NULLIF/TRIM) before comparison.",
          ),
        );
      }
    }
    return diagnostics;
  },
};
