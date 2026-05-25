import type { Rule } from "../types.js";
import { report } from "../utils/report.js";

const BARE_JOIN_PATTERN = /\b(?:inner|left|right|full|cross)?\s*join\s+[\s\S]*?(?=\b(?:inner|left|right|full|cross)?\s*join\b|$)/gi;

export const sqlJoinConditionRequired: Rule = {
  id: "sql-join-condition-required",
  severity: "warn",
  category: "SQL Quality",
  recommendation: "JOIN clauses should include ON/USING conditions unless cross join is explicit.",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      const content = readFile(file);
      for (const match of content.matchAll(BARE_JOIN_PATTERN)) {
        const chunk = (match[0] ?? "").toLowerCase();
        if (chunk.includes("cross join")) continue;
        if (chunk.includes(" on ") || chunk.includes(" using ")) continue;
        diagnostics.push(
          report(
            sqlJoinConditionRequired,
            file,
            "JOIN without ON/USING condition detected",
            "Add ON/USING predicate, or make cross join explicit if intentional.",
          ),
        );
      }
    }
    return diagnostics;
  },
};
