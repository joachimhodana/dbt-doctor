import type { Rule } from "../types.js";
import { report } from "../utils/report.js";

const COUNT_NON_STAR_PATTERN = /\bcount\s*\(([^)]+)\)/gi;

export const sqlCountStarPreferred: Rule = {
  id: "sql-count-star-preferred",
  severity: "warn",
  category: "SQL Convention",
  recommendation: "Prefer COUNT(*) over COUNT(1) or COUNT(constant).",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      const content = readFile(file);
      for (const match of content.matchAll(COUNT_NON_STAR_PATTERN)) {
        const arg = (match[1] ?? "").trim().toLowerCase();
        if (arg === "*" || arg === "distinct *") continue;
        if (!/^\d+$/.test(arg)) continue;
        diagnostics.push(
          report(
            sqlCountStarPreferred,
            file,
            `COUNT(${match[1]}) detected`,
            "Use COUNT(*) for row counts.",
          ),
        );
      }
    }
    return diagnostics;
  },
};
