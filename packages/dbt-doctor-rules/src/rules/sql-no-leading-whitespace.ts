import type { Rule } from "../types.js";
import { report } from "../utils/report.js";

const hasLeadingWhitespace = (value: string): boolean => /^(\s)/.test(value);

export const sqlNoLeadingWhitespace: Rule = {
  id: "sql-no-leading-whitespace",
  severity: "warn",
  category: "SQL Style",
  recommendation: "Do not start SQL files with leading whitespace.",
  tags: ["style", "sql-style"],
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];

    for (const filePath of sqlFiles) {
      const content = readFile(filePath);
      if (content.length === 0 || !hasLeadingWhitespace(content)) continue;

      diagnostics.push(
        report(
          sqlNoLeadingWhitespace,
          filePath,
          "SQL file begins with whitespace before the first token.",
          "Start SQL files at column 1 for SQLFluff LT13 compatibility.",
        ),
      );
    }

    return diagnostics;
  },
};
