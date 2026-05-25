import type { Rule } from "../types.js";
import { report } from "../utils/report.js";

const SPECIAL_IDENTIFIER_PATTERN = /\b([a-zA-Z_][\w$]*-[a-zA-Z_][\w$]*)\b/g;

export const sqlReferenceSpecialCharsQuoted: Rule = {
  id: "sql-reference-special-chars-quoted",
  severity: "warn",
  category: "SQL Style",
  recommendation: "Identifiers containing special characters should be quoted.",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      const content = readFile(file);
      for (const match of content.matchAll(SPECIAL_IDENTIFIER_PATTERN)) {
        const value = match[1] ?? "";
        if (!value) continue;
        diagnostics.push(
          report(
            sqlReferenceSpecialCharsQuoted,
            file,
            `Identifier "${value}" contains special characters and is unquoted`,
            "Quote identifiers with special characters.",
          ),
        );
      }
    }
    return diagnostics;
  },
};
