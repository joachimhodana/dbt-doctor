import type { Rule } from "../types.js";
import { offsetToLineColumn } from "../utils/sql-cst.js";
import { report } from "../utils/report.js";

interface TokenDef {
  open: string;
  close: string;
  label: string;
}

const TOKENS: TokenDef[] = [
  { open: "{{", close: "}}", label: "expression" },
  { open: "{%", close: "%}", label: "block" },
  { open: "{#", close: "#}", label: "comment" },
];

const findFirstInvalidOffset = (content: string, token: TokenDef): number | null => {
  let cursor = 0;
  while (cursor < content.length) {
    const start = content.indexOf(token.open, cursor);
    if (start < 0) break;
    const end = content.indexOf(token.close, start + token.open.length);
    if (end < 0) return start;
    cursor = end + token.close.length;
  }
  return null;
};

export const jinjaSyntaxValid: Rule = {
  id: "jinja-syntax-valid",
  severity: "warn",
  category: "SQL Quality",
  recommendation: "Ensure all Jinja tags in SQL have matching closing delimiters.",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];

    for (const file of sqlFiles) {
      const content = readFile(file);

      for (const token of TOKENS) {
        const invalidOffset = findFirstInvalidOffset(content, token);
        if (invalidOffset === null) continue;

        const position = offsetToLineColumn(content, invalidOffset);
        diagnostics.push(
          report(
            jinjaSyntaxValid,
            file,
            `Unclosed Jinja ${token.label} tag (${token.open} ... ${token.close})`,
            "Close the Jinja tag or remove incomplete templating syntax.",
            position.line,
            position.column,
          ),
        );
      }
    }

    return diagnostics;
  },
};
