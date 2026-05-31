import type { Rule } from "../types.js";
import { maskJinjaBlocks } from "../utils/jinja-sql-scan.js";
import { report } from "../utils/report.js";

const BARE_JOIN_PATTERN =
  /\b(?:inner|left|right|full|cross)?\s*join\s+[\s\S]*?(?=\b(?:inner|left|right|full|cross)?\s*join\b|$)/gi;

const hasJoinCondition = (chunk: string): boolean => /\b(?:on|using)\b/i.test(chunk);

export const sqlJoinConditionRequired: Rule = {
  id: "sql-join-condition-required",
  severity: "warn",
  category: "SQL Quality",
  tags: ["style", "sql-style"],
  recommendation: "JOIN clauses should include ON/USING conditions unless cross join is explicit.",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      const content = maskJinjaBlocks(readFile(file));
      for (const match of content.matchAll(BARE_JOIN_PATTERN)) {
        const chunk = (match[0] ?? "").toLowerCase();
        if (chunk.includes("cross join")) continue;
        if (hasJoinCondition(chunk)) continue;
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
