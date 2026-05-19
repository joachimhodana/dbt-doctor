import { DEFAULT_MAX_MODEL_SQL_LINE_LENGTH } from "../constants.js";
import type { Rule } from "../types.js";
import { report } from "../utils/report.js";

export const modelLineLength: Rule = {
  id: "model-line-length",
  severity: "warn",
  category: "Best Practices",
  tags: ["style"],
  recommendation: `Keep model SQL lines within ${DEFAULT_MAX_MODEL_SQL_LINE_LENGTH} characters (or enforce via sqlfluff)`,
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];
    const max = DEFAULT_MAX_MODEL_SQL_LINE_LENGTH;
    for (const file of sqlFiles) {
      const lines = readFile(file).split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const len = line.trimEnd().length;
        if (len === 0 || len <= max) continue;
        diagnostics.push(
          report(
            modelLineLength,
            file,
            `Line ${i + 1} is ${len} characters (limit ${max})`,
            "Break long expressions, CTEs, or lists across lines for reviews and diffs. Align with sqlfluff line_length rules if you use sqlfluff.",
            i + 1,
            1,
          ),
        );
      }
    }
    return diagnostics;
  },
};
