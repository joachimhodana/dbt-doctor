import type { Rule } from "../types.js";
import { offsetToLineColumn } from "../utils/sql-cst.js";
import {
  collectTableAliases,
  findJinjaRanges,
  isInsideRanges,
  isJinjaQualifier,
  isOffsetInSqlComment,
} from "../utils/jinja-sql-scan.js";
import { report } from "../utils/report.js";

const QUALIFIED_REFERENCE_PATTERN = /\b([a-zA-Z_][\w$]*)\.([a-zA-Z_][\w$]*)\b/g;

const SQL_KEYWORDS = new Set([
  "select",
  "from",
  "where",
  "join",
  "left",
  "right",
  "inner",
  "outer",
  "full",
  "cross",
  "group",
  "order",
  "having",
  "on",
  "and",
  "or",
  "case",
  "when",
  "then",
  "else",
  "end",
  "union",
  "all",
]);

export const sqlReferenceObjectInFrom: Rule = {
  id: "sql-reference-object-in-from",
  severity: "warn",
  category: "SQL Quality",
  tags: ["style", "sql-style"],
  recommendation:
    "Qualified references should use aliases/relations declared in FROM or JOIN clauses.",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];

    for (const file of sqlFiles) {
      const content = readFile(file);
      const jinjaRanges = findJinjaRanges(content);
      const allowedAliases = collectTableAliases(content);

      if (allowedAliases.size === 0) continue;

      for (const match of content.matchAll(QUALIFIED_REFERENCE_PATTERN)) {
        if (match.index === undefined) continue;
        if (isInsideRanges(match.index, jinjaRanges)) continue;
        if (isOffsetInSqlComment(content, match.index)) continue;

        const qualifier = (match[1] ?? "").toLowerCase();
        if (!qualifier) continue;
        if (SQL_KEYWORDS.has(qualifier)) continue;
        if (isJinjaQualifier(qualifier)) continue;
        if (allowedAliases.has(qualifier)) continue;

        const position = offsetToLineColumn(content, match.index);
        diagnostics.push(
          report(
            sqlReferenceObjectInFrom,
            file,
            `Reference qualifier "${qualifier}" is not declared in FROM/JOIN`,
            "Use a declared alias/relation in FROM/JOIN, or fix the qualifier.",
            position.line,
            position.column,
          ),
        );
      }
    }

    return diagnostics;
  },
};
