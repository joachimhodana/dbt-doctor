import type { Rule } from "../types.js";
import { report } from "../utils/report.js";

export const hardcodedDatabase: Rule = {
  id: "hardcoded-database",
  severity: "warn",
  category: "Configuration",
  recommendation: "Use target.database or vars instead of hardcoded database names",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      const content = readFile(file);
      if (!/\bfrom\s+[\w-]+\.[\w-]+\.[\w-]+/i.test(content)) continue;
      if (/\{\{\s*target\./.test(content) || /\{\{\s*var\(/.test(content)) continue;
      diagnostics.push(
        report(
          hardcodedDatabase,
          file,
          "Possible hardcoded database/schema reference in model SQL",
          "Prefer {{ ref() }} and {{ source() }} over three-part identifiers.",
        ),
      );
    }
    return diagnostics;
  },
};
