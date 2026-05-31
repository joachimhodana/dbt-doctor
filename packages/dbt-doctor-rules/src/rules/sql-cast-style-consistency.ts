import type { Rule } from "../types.js";
import { report } from "../utils/report.js";

const CAST_PATTERN = /\bcast\s*\(/gi;
const SHORTHAND_CAST_PATTERN = /::\s*[a-zA-Z_][\w$]*/gi;

export const sqlCastStyleConsistency: Rule = {
  id: "sql-cast-style-consistency",
  severity: "warn",
  category: "SQL Convention",
  tags: ["style", "sql-style"],
  recommendation: "Use one cast style consistently within a file.",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      const content = readFile(file);
      const hasCast = CAST_PATTERN.test(content);
      const hasShorthand = SHORTHAND_CAST_PATTERN.test(content);
      if (!(hasCast && hasShorthand)) continue;
      diagnostics.push(
        report(
          sqlCastStyleConsistency,
          file,
          "Mixed CAST styles detected (`CAST()` and `::`)",
          "Choose one casting style per file for consistency.",
        ),
      );
    }
    return diagnostics;
  },
};
