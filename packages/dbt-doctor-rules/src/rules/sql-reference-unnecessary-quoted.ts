import type { Rule } from "../types.js";
import { findJinjaRanges, isInsideRanges } from "../utils/jinja-sql-scan.js";
import { report } from "../utils/report.js";

const QUOTED_IDENTIFIER_PATTERN = /"([a-zA-Z_][\w$]*)"/g;

export const sqlReferenceUnnecessaryQuoted: Rule = {
  id: "sql-reference-unnecessary-quoted",
  severity: "warn",
  category: "SQL Convention",
  tags: ["style", "sql-style"],
  recommendation: "Avoid unnecessary quoted identifiers when plain identifiers are safe.",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      const content = readFile(file);
      const jinjaRanges = findJinjaRanges(content);
      for (const match of content.matchAll(QUOTED_IDENTIFIER_PATTERN)) {
        if (match.index !== undefined && isInsideRanges(match.index, jinjaRanges)) continue;
        const identifier = match[1] ?? "";
        if (!identifier) continue;
        diagnostics.push(
          report(
            sqlReferenceUnnecessaryQuoted,
            file,
            `Quoted identifier "${identifier}" may be unnecessary`,
            "Prefer unquoted identifiers unless quoting is required.",
          ),
        );
      }
    }
    return diagnostics;
  },
};
