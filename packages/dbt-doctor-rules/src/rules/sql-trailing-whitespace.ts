import type { Rule } from "../types.js";
import { report } from "../utils/report.js";

export const sqlTrailingWhitespace: Rule = {
  id: "sql-trailing-whitespace",
  severity: "warn",
  category: "SQL Style",
  recommendation: "Remove trailing whitespace at end of lines.",
  tags: ["style", "phase5"],
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];

    for (const filePath of sqlFiles) {
      const lines = readFile(filePath).split("\n");
      for (let index = 0; index < lines.length; index++) {
        const line = lines[index] ?? "";
        if (!/[ \t]+$/.test(line)) continue;

        diagnostics.push(
          report(
            sqlTrailingWhitespace,
            filePath,
            `Line ${index + 1} has trailing whitespace.`,
            "Strip trailing spaces/tabs for clean diffs (SQLFluff LT01 parity).",
            index + 1,
            line.length,
          ),
        );
      }
    }

    return diagnostics;
  },
};
