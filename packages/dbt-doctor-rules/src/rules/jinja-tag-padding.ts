import type { Rule } from "../types.js";
import { offsetToLineColumn } from "../utils/sql-cst.js";
import { report } from "../utils/report.js";

const JINJA_TAG_PATTERN = /\{\{[\s\S]*?\}\}|\{%[\s\S]*?%\}/g;

const hasSinglePadding = (inner: string): boolean => {
  if (inner.includes("\n")) return true;
  return /^\s[^\n]*\s$/u.test(inner) && !/^\s{2,}|.*\s{2,}$/u.test(inner);
};

export const jinjaTagPadding: Rule = {
  id: "jinja-tag-padding",
  severity: "warn",
  category: "SQL Style",
  recommendation: "Use a single space around content inside Jinja tags on single-line expressions.",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];

    for (const file of sqlFiles) {
      const content = readFile(file);
      for (const match of content.matchAll(JINJA_TAG_PATTERN)) {
        if (match.index === undefined) continue;
        const raw = match[0] ?? "";
        const opener = raw.startsWith("{{") ? "{{" : "{%";
        const closer = raw.endsWith("}}") ? "}}" : "%}";
        const inner = raw.slice(opener.length, raw.length - closer.length);
        if (hasSinglePadding(inner)) continue;

        const position = offsetToLineColumn(content, match.index);
        diagnostics.push(
          report(
            jinjaTagPadding,
            file,
            "Jinja tag should use single-space padding",
            `Format as ${opener} expression ${closer} (single spaces), or multi-line block formatting.`,
            position.line,
            position.column,
          ),
        );
      }
    }

    return diagnostics;
  },
};
