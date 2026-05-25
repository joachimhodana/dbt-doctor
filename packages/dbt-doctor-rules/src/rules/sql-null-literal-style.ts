import type { Rule } from "../types.js";
import { report } from "../utils/report.js";

const QUOTED_NULL_PATTERN = /'null'|"null"/gi;

export const sqlNullLiteralStyle: Rule = {
  id: "sql-null-literal-style",
  severity: "warn",
  category: "SQL Convention",
  recommendation: "Use NULL keyword, not quoted 'null' string literal.",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      const content = readFile(file);
      for (const _ of content.matchAll(QUOTED_NULL_PATTERN)) {
        diagnostics.push(
          report(
            sqlNullLiteralStyle,
            file,
            "Quoted null literal detected",
            "Use NULL keyword for null values; avoid quoted null strings.",
          ),
        );
      }
    }
    return diagnostics;
  },
};
