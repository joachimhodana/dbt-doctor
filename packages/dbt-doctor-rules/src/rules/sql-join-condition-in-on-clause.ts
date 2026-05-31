import type { Rule } from "../types.js";
import { report } from "../utils/report.js";

const JOIN_THEN_WHERE_PATTERN =
  /\bjoin\s+[a-zA-Z_][\w$]*(?:\.[a-zA-Z_][\w$]*){0,2}\b(?![\s\S]*?\bon\b)([\s\S]*?)\bwhere\b[\s\S]*?[a-zA-Z_][\w$]*\.[a-zA-Z_][\w$]*\s*=\s*[a-zA-Z_][\w$]*\.[a-zA-Z_][\w$]*/gi;

export const sqlJoinConditionInOnClause: Rule = {
  id: "sql-join-condition-in-on-clause",
  severity: "warn",
  category: "SQL Style",
  tags: ["style", "sql-style"],
  recommendation: "Put join predicates in ON clauses rather than WHERE clauses.",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      const content = readFile(file);
      for (const _ of content.matchAll(JOIN_THEN_WHERE_PATTERN)) {
        diagnostics.push(
          report(
            sqlJoinConditionInOnClause,
            file,
            "Potential join predicate found in WHERE clause",
            "Move join predicates into JOIN ... ON clauses for clearer intent.",
          ),
        );
      }
    }
    return diagnostics;
  },
};
