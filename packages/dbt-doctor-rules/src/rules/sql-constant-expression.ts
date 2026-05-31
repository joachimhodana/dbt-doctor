import type { Rule } from "../types.js";
import { report } from "../utils/report.js";

const CONSTANT_EXPR_PATTERN =
  /\b(?:where|on|having)\b[\s\S]*?\b(?:1\s*=\s*1|0\s*=\s*0|([a-zA-Z_][\w$]*)\s*=\s*\1)\b/gi;

export const sqlConstantExpression: Rule = {
  id: "sql-constant-expression",
  severity: "warn",
  category: "SQL Quality",
  tags: ["style", "sql-style"],
  recommendation: "Avoid constant or always-true expressions in predicates.",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      const content = readFile(file);
      for (const _ of content.matchAll(CONSTANT_EXPR_PATTERN)) {
        diagnostics.push(
          report(
            sqlConstantExpression,
            file,
            "Constant expression detected in predicate",
            "Remove constant predicate expressions (for example `1=1` or `x=x`).",
          ),
        );
      }
    }
    return diagnostics;
  },
};
