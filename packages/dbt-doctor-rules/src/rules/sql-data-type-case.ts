import type { Rule } from "../types.js";
import { report } from "../utils/report.js";

const TYPE_PATTERN = /\b(cast\s*\([^)]*?\bas\s+([a-zA-Z_][\w$]*))/gi;

export const sqlDataTypeCase: Rule = {
  id: "sql-data-type-case",
  severity: "warn",
  category: "SQL Style",
  recommendation: "Use uppercase data types in CAST expressions.",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      const content = readFile(file);
      for (const match of content.matchAll(TYPE_PATTERN)) {
        const dtype = match[2] ?? "";
        if (!dtype) continue;
        if (dtype === dtype.toUpperCase()) continue;
        diagnostics.push(
          report(
            sqlDataTypeCase,
            file,
            `CAST data type "${dtype}" should be uppercase`,
            "Use uppercase data types in CAST (for example `CAST(col AS STRING)`).",
          ),
        );
      }
    }
    return diagnostics;
  },
};
