import type { Rule } from "../types.js";
import { hasUnionByName, maskJinjaBlocks, stripSqlComments } from "../utils/jinja-sql-scan.js";
import { report } from "../utils/report.js";

const SET_OPERATOR_PATTERN = /\bunion(?:\s+all)?\b|\bintersect\b|\bexcept\b/i;
const SELECT_LIST_PATTERN = /\bselect\s+([\s\S]*?)\bfrom\b/i;

const countSelectTargets = (selectSql: string): number => {
  const match = selectSql.match(SELECT_LIST_PATTERN);
  if (!match) return 0;
  const list = match[1] ?? "";
  if (!list.trim()) return 0;
  if (/\*/.test(list.trim())) return 0;
  return list
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean).length;
};

export const sqlSetOperatorColumnCountMatch: Rule = {
  id: "sql-set-operator-column-count-match",
  severity: "warn",
  category: "SQL Quality",
  tags: ["style", "sql-style"],
  recommendation: "SELECT statements in set operators should project the same number of columns.",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      const rawContent = readFile(file);
      if (hasUnionByName(rawContent)) continue;

      const content = stripSqlComments(maskJinjaBlocks(rawContent));
      if (!SET_OPERATOR_PATTERN.test(content)) continue;

      const branches = content.split(/\bunion(?:\s+all)?\b|\bintersect\b|\bexcept\b/gi);
      const counts = branches.map(countSelectTargets).filter((count) => count > 0);
      if (counts.length < 2) continue;
      const expected = counts[0];
      if (counts.some((count) => count !== expected)) {
        diagnostics.push(
          report(
            sqlSetOperatorColumnCountMatch,
            file,
            "Set operator branches project different column counts",
            "Align projected column counts across UNION/INTERSECT/EXCEPT branches.",
          ),
        );
      }
    }
    return diagnostics;
  },
};
