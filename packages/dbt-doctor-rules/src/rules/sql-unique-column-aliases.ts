import type { Rule } from "../types.js";
import { report } from "../utils/report.js";

const SELECT_FROM_PATTERN = /\bselect\s+([\s\S]*?)\bfrom\b/i;
const ALIAS_PATTERN = /\bas\s+("?)([a-zA-Z_][\w$]*)\1\b/gi;

export const sqlUniqueColumnAliases: Rule = {
  id: "sql-unique-column-aliases",
  severity: "warn",
  category: "SQL Quality",
  tags: ["style", "sql-style"],
  recommendation: "Column aliases should be unique within a SELECT clause.",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      const content = readFile(file);
      const selectMatch = content.match(SELECT_FROM_PATTERN);
      if (!selectMatch) continue;
      const selectPart = selectMatch[1] ?? "";
      const seen = new Set<string>();
      for (const match of selectPart.matchAll(ALIAS_PATTERN)) {
        const alias = (match[2] ?? "").toLowerCase();
        if (!alias) continue;
        if (seen.has(alias)) {
          diagnostics.push(
            report(
              sqlUniqueColumnAliases,
              file,
              `Duplicate column alias "${match[2]}" detected`,
              "Use unique aliases for selected columns.",
            ),
          );
          continue;
        }
        seen.add(alias);
      }
    }
    return diagnostics;
  },
};
