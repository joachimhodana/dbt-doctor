import type { Rule } from "../types.js";
import { report } from "../utils/report.js";

const KEYWORDS = ["select", "from", "where", "group", "order", "join", "having", "limit"];

const buildKeywordPattern = (keyword: string): RegExp =>
  new RegExp(`\\b(?:select|from|where|group\\s+by|order\\s+by|join)\\s+${keyword}\\b`, "gi");

export const sqlReferenceKeywordQuoted: Rule = {
  id: "sql-reference-keyword-quoted",
  severity: "warn",
  category: "SQL Style",
  recommendation: "If reserved words are used as identifiers, quote them explicitly.",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      const content = readFile(file);
      for (const keyword of KEYWORDS) {
        const pattern = buildKeywordPattern(keyword);
        if (!pattern.test(content)) continue;
        diagnostics.push(
          report(
            sqlReferenceKeywordQuoted,
            file,
            `Unquoted keyword-like identifier "${keyword}" detected`,
            "Quote keyword identifiers to avoid parser ambiguity.",
          ),
        );
      }
    }
    return diagnostics;
  },
};
