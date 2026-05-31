import type { Rule } from "../types.js";
import { offsetToLineColumn } from "../utils/sql-cst.js";
import { maskJinjaBlocks, stripSqlComments } from "../utils/jinja-sql-scan.js";
import { report } from "../utils/report.js";

const FROM_PATTERN = /\bfrom\b/gi;
const CLAUSE_STOP_PATTERN =
  /^\s*(where|group|order|having|limit|qualify|window|union|intersect|except)\b/i;
const JOIN_STOP_PATTERN = /^\s*(left|right|inner|outer|full|cross|natural)?\s*join\b/i;

const findFromClauseCommaJoin = (content: string, fromIndex: number): number | null => {
  let index = fromIndex + "from".length;
  let depth = 0;

  while (index < content.length && index - fromIndex < 500) {
    const tail = content.slice(index);

    if (depth === 0 && (CLAUSE_STOP_PATTERN.test(tail) || JOIN_STOP_PATTERN.test(tail))) {
      return null;
    }

    if (depth === 0 && /^\s*\)/.test(tail)) {
      return null;
    }

    const char = content[index]!;
    if (char === "(") {
      depth += 1;
      index += 1;
      continue;
    }
    if (char === ")") {
      depth = Math.max(0, depth - 1);
      index += 1;
      continue;
    }

    if (char === "," && depth === 0) {
      const beforeComma = content.slice(fromIndex, index).trimEnd();
      if (/\)\s*$/.test(beforeComma)) {
        index += 1;
        continue;
      }

      if (/^\s*,\s*[a-zA-Z_"`\[]/.test(content.slice(index))) {
        return index;
      }
    }

    index += 1;
  }

  return null;
};

export const sqlNoCommaJoin: Rule = {
  id: "sql-no-comma-join",
  severity: "warn",
  category: "SQL Quality",
  tags: ["style", "sql-style"],
  recommendation: "Use explicit JOIN syntax instead of comma joins in FROM clauses.",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];

    for (const file of sqlFiles) {
      const content = stripSqlComments(maskJinjaBlocks(readFile(file)));

      for (const match of content.matchAll(FROM_PATTERN)) {
        if (match.index === undefined) continue;

        const commaIndex = findFromClauseCommaJoin(content, match.index);
        if (commaIndex === null) continue;

        const position = offsetToLineColumn(content, match.index);
        diagnostics.push(
          report(
            sqlNoCommaJoin,
            file,
            "Implicit comma join detected in FROM clause",
            "Replace comma joins with explicit JOIN ... ON/USING syntax.",
            position.line,
            position.column,
          ),
        );
      }
    }

    return diagnostics;
  },
};
