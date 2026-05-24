import type { Rule } from "../types.js";
import { report } from "../utils/report.js";

const resolveIndentWidth = (ruleConfig: Record<string, unknown>): number => {
  const raw = ruleConfig.indentWidth;
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 1 && raw <= 8) {
    return raw;
  }
  return 2;
};

const isIgnoredLine = (line: string): boolean => {
  const trimmed = line.trim();
  return (
    trimmed.length === 0 ||
    trimmed.startsWith("--") ||
    trimmed.startsWith("/*") ||
    trimmed.startsWith("*")
  );
};

export const sqlIndentationConsistency: Rule = {
  id: "sql-indentation-consistency",
  severity: "warn",
  category: "SQL Style",
  recommendation: "Use consistent spaces-only indentation.",
  tags: ["style", "phase5"],
  run: ({ sqlFiles, readFile, ruleConfig }) => {
    const diagnostics = [];
    const indentWidth = resolveIndentWidth(ruleConfig);

    for (const filePath of sqlFiles) {
      const lines = readFile(filePath).split("\n");
      for (let index = 0; index < lines.length; index++) {
        const line = lines[index] ?? "";
        if (isIgnoredLine(line)) continue;

        const leading = line.match(/^[ \t]*/)?.[0] ?? "";
        if (leading.includes("\t")) {
          diagnostics.push(
            report(
              sqlIndentationConsistency,
              filePath,
              `Line ${index + 1} uses tab indentation.`,
              "Use spaces for indentation (SQLFluff LT02 parity).",
              index + 1,
              1,
            ),
          );
          continue;
        }

        if (leading.length % indentWidth !== 0) {
          diagnostics.push(
            report(
              sqlIndentationConsistency,
              filePath,
              `Line ${index + 1} indentation (${leading.length}) is not a multiple of ${indentWidth}.`,
              "Use consistent indentation width across SQL files (SQLFluff LT02 parity).",
              index + 1,
              1,
            ),
          );
        }
      }
    }

    return diagnostics;
  },
};
