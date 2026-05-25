import type { Rule } from "../types.js";
import { report } from "../utils/report.js";

const TABLE_ALIAS_PATTERN = /\b(?:from|join)\s+[a-zA-Z_][\w$]*(?:\.[a-zA-Z_][\w$]*){0,2}\s+(?:as\s+)?([a-zA-Z_][\w$]*)\b/gi;

const MIN_ALIAS_LENGTH = 2;

export const sqlAliasLengthMin: Rule = {
  id: "sql-alias-length-min",
  severity: "warn",
  category: "SQL Style",
  recommendation: "Avoid overly short table aliases.",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      const content = readFile(file);
      for (const match of content.matchAll(TABLE_ALIAS_PATTERN)) {
        const alias = match[1] ?? "";
        if (alias.length >= MIN_ALIAS_LENGTH) continue;
        diagnostics.push(
          report(
            sqlAliasLengthMin,
            file,
            `Alias "${alias}" is too short`,
            `Use table aliases with at least ${MIN_ALIAS_LENGTH} characters when aliasing is needed.`,
          ),
        );
      }
    }
    return diagnostics;
  },
};
