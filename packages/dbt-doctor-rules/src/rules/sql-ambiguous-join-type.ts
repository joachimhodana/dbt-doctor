import type { Rule } from "../types.js";
import { report } from "../utils/report.js";

const BARE_JOIN_PATTERN = /(?:^|\n)\s*join\s+[a-zA-Z_][\w$]*(?:\.[a-zA-Z_][\w$]*){0,2}\b/gi;

export const sqlAmbiguousJoinType: Rule = {
  id: "sql-ambiguous-join-type",
  severity: "warn",
  category: "SQL Style",
  tags: ["style", "sql-style"],
  recommendation: "Make JOIN type explicit (INNER/LEFT/RIGHT/FULL/CROSS).",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      const content = readFile(file);
      for (const _ of content.matchAll(BARE_JOIN_PATTERN)) {
        diagnostics.push(
          report(
            sqlAmbiguousJoinType,
            file,
            "Implicit JOIN type detected",
            "Use explicit join type (for example INNER JOIN or LEFT JOIN).",
          ),
        );
      }
    }
    return diagnostics;
  },
};
