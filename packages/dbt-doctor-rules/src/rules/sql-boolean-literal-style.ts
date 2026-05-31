import type { Rule } from "../types.js";
import { report } from "../utils/report.js";

const LOWER_BOOL_PATTERN = /\b(true|false)\b/g;

export const sqlBooleanLiteralStyle: Rule = {
  id: "sql-boolean-literal-style",
  severity: "warn",
  category: "SQL Convention",
  tags: ["style", "sql-style"],
  recommendation: "Use uppercase boolean literals.",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      const content = readFile(file);
      for (const match of content.matchAll(LOWER_BOOL_PATTERN)) {
        const raw = match[0] ?? "";
        if (raw === raw.toUpperCase()) continue;
        diagnostics.push(
          report(
            sqlBooleanLiteralStyle,
            file,
            `Boolean literal "${raw}" should be uppercase`,
            "Use TRUE/FALSE boolean literal casing.",
          ),
        );
      }
    }
    return diagnostics;
  },
};
