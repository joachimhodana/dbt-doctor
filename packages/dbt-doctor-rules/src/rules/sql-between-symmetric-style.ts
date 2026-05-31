import type { Rule } from "../types.js";
import { report } from "../utils/report.js";

const BETWEEN_SYMMETRIC_PATTERN = /\bbetween\s+symmetric\b/gi;

export const sqlBetweenSymmetricStyle: Rule = {
  id: "sql-between-symmetric-style",
  severity: "warn",
  category: "SQL Convention",
  tags: ["style", "sql-style"],
  recommendation: "Avoid BETWEEN SYMMETRIC for broader dialect portability.",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      const content = readFile(file);
      for (const _ of content.matchAll(BETWEEN_SYMMETRIC_PATTERN)) {
        diagnostics.push(
          report(
            sqlBetweenSymmetricStyle,
            file,
            "BETWEEN SYMMETRIC detected",
            "Prefer explicit lower/upper bound logic for portability.",
          ),
        );
      }
    }
    return diagnostics;
  },
};
