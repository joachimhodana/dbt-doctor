import type { Rule } from "../types.js";
import { report } from "../utils/report.js";

const JOIN_ALIAS_PATTERN =
  /\b(?:left|right|full|inner|cross)?\s*join\s+[a-zA-Z_][\w$]*(?:\.[a-zA-Z_][\w$]*){0,2}\s+(?:as\s+)?([a-zA-Z_][\w$]*)\b/gi;

export const sqlUnusedJoinAlias: Rule = {
  id: "sql-unused-join-alias",
  severity: "warn",
  category: "SQL Quality",
  recommendation: "Joined table aliases should be referenced or removed.",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      const content = readFile(file);
      for (const match of content.matchAll(JOIN_ALIAS_PATTERN)) {
        const alias = match[1] ?? "";
        if (!alias) continue;
        const aliasUsePattern = new RegExp(`\\b${alias}\\.`, "gi");
        const usages = content.match(aliasUsePattern) ?? [];
        if (usages.length > 1) continue;
        diagnostics.push(
          report(
            sqlUnusedJoinAlias,
            file,
            `Joined alias "${alias}" appears unused outside join clause`,
            "Remove unused joins or reference the joined relation.",
          ),
        );
      }
    }
    return diagnostics;
  },
};
