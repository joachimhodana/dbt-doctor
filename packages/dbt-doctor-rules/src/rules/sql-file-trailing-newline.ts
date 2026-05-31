import type { Rule } from "../types.js";
import { report } from "../utils/report.js";

export const sqlFileTrailingNewline: Rule = {
  id: "sql-file-trailing-newline",
  severity: "warn",
  category: "SQL Style",
  recommendation: "Ensure SQL files end with a trailing newline.",
  tags: ["style", "sql-style"],
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];

    for (const filePath of sqlFiles) {
      const content = readFile(filePath);
      if (content.length === 0 || content.endsWith("\n")) continue;

      diagnostics.push(
        report(
          sqlFileTrailingNewline,
          filePath,
          "SQL file does not end with a trailing newline.",
          "End SQL files with a newline for stable diffs and SQLFluff LT12 compatibility.",
        ),
      );
    }

    return diagnostics;
  },
};
