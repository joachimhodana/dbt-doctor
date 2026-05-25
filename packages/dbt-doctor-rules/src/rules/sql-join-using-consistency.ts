import type { Rule } from "../types.js";
import { report } from "../utils/report.js";

const USING_PATTERN = /\bjoin\b[\s\S]*?\busing\s*\(([^)]+)\)/gi;

export const sqlJoinUsingConsistency: Rule = {
  id: "sql-join-using-consistency",
  severity: "warn",
  category: "SQL Convention",
  recommendation: "Prefer ON clauses over USING for explicit join semantics.",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      const content = readFile(file);
      for (const match of content.matchAll(USING_PATTERN)) {
        diagnostics.push(
          report(
            sqlJoinUsingConsistency,
            file,
            `JOIN ... USING(${(match[1] ?? "").trim()}) detected`,
            "Use explicit JOIN ... ON predicates for clarity and portability.",
          ),
        );
      }
    }
    return diagnostics;
  },
};
