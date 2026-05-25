import type { Rule } from "../types.js";
import { report } from "../utils/report.js";

const DERIVED_TABLE_NO_ALIAS_PATTERN =
  /\b(?:from|join)\s*\(\s*select[\s\S]*?\)\s*(?!as\s+[a-zA-Z_][\w$]*\b|[a-zA-Z_][\w$]*\b)/gi;

export const sqlDerivedTableAliasRequired: Rule = {
  id: "sql-derived-table-alias-required",
  severity: "warn",
  category: "SQL Style",
  recommendation: "Derived tables should always be aliased.",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      const content = readFile(file);
      for (const _ of content.matchAll(DERIVED_TABLE_NO_ALIAS_PATTERN)) {
        diagnostics.push(
          report(
            sqlDerivedTableAliasRequired,
            file,
            "Derived table without alias detected",
            "Add an alias after each derived table (subquery in FROM/JOIN).",
          ),
        );
      }
    }
    return diagnostics;
  },
};
