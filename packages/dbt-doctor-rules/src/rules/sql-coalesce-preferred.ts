import type { Rule } from "../types.js";
import { report } from "../utils/report.js";

const NON_STANDARD_NULL_FN_PATTERN = /\b(ifnull|nvl)\s*\(/gi;

export const sqlCoalescePreferred: Rule = {
  id: "sql-coalesce-preferred",
  severity: "warn",
  category: "SQL Convention",
  recommendation: "Prefer COALESCE over dialect-specific null-handling helpers.",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      const content = readFile(file);
      for (const match of content.matchAll(NON_STANDARD_NULL_FN_PATTERN)) {
        diagnostics.push(
          report(
            sqlCoalescePreferred,
            file,
            `${(match[1] ?? "").toUpperCase()}() detected`,
            "Prefer COALESCE() for portable null-handling semantics.",
          ),
        );
      }
    }
    return diagnostics;
  },
};
