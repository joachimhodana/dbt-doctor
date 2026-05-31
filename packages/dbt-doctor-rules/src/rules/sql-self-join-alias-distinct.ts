import type { Rule } from "../types.js";
import { report } from "../utils/report.js";

const FROM_PATTERN =
  /\bfrom\s+([a-zA-Z_][\w$]*(?:\.[a-zA-Z_][\w$]*){0,2})\s+(?:as\s+)?([a-zA-Z_][\w$]*)/i;
const JOIN_PATTERN =
  /\bjoin\s+([a-zA-Z_][\w$]*(?:\.[a-zA-Z_][\w$]*){0,2})\s+(?:as\s+)?([a-zA-Z_][\w$]*)/gi;

export const sqlSelfJoinAliasDistinct: Rule = {
  id: "sql-self-join-alias-distinct",
  severity: "warn",
  category: "SQL Style",
  tags: ["style", "sql-style"],
  recommendation: "Self-joins should use distinct aliases per relation instance.",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      const content = readFile(file);
      const fromMatch = content.match(FROM_PATTERN);
      if (!fromMatch) continue;
      const fromRelation = fromMatch[1]?.toLowerCase();
      const fromAlias = fromMatch[2]?.toLowerCase();
      if (!fromRelation || !fromAlias) continue;

      for (const match of content.matchAll(JOIN_PATTERN)) {
        const joinRelation = match[1]?.toLowerCase();
        const joinAlias = match[2]?.toLowerCase();
        if (joinRelation !== fromRelation || joinAlias !== fromAlias) continue;
        diagnostics.push(
          report(
            sqlSelfJoinAliasDistinct,
            file,
            `Self-join reuses alias "${match[2]}" for relation "${match[1]}"`,
            "Use different aliases for each self-joined relation instance.",
          ),
        );
      }
    }
    return diagnostics;
  },
};
