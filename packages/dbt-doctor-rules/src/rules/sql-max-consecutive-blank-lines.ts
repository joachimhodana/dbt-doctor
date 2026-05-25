import type { Rule } from "../types.js";
import { report } from "../utils/report.js";

const DEFAULT_MAX_CONSECUTIVE_BLANK_LINES = 1;

const readLimit = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, Math.floor(value));
  if (typeof value === "string" && /^\d+$/.test(value.trim())) return Number.parseInt(value.trim(), 10);
  return DEFAULT_MAX_CONSECUTIVE_BLANK_LINES;
};

export const sqlMaxConsecutiveBlankLines: Rule = {
  id: "sql-max-consecutive-blank-lines",
  severity: "warn",
  category: "SQL Style",
  recommendation: "Limit consecutive blank lines in SQL files.",
  run: ({ sqlFiles, readFile, ruleConfig }) => {
    const diagnostics = [];
    const maxAllowed = readLimit(ruleConfig.maxConsecutiveBlankLines);

    for (const file of sqlFiles) {
      const lines = readFile(file).split(/\r?\n/u);
      let runLength = 0;

      for (let i = 0; i < lines.length; i += 1) {
        if ((lines[i] ?? "").trim().length === 0) {
          runLength += 1;
        } else {
          runLength = 0;
        }

        if (runLength <= maxAllowed) continue;

        diagnostics.push(
          report(
            sqlMaxConsecutiveBlankLines,
            file,
            `Too many consecutive blank lines (${runLength} > ${maxAllowed})`,
            "Collapse repeated empty lines to match your blank-line style limit.",
            i + 1,
            1,
          ),
        );
        runLength = 0;
      }
    }

    return diagnostics;
  },
};
