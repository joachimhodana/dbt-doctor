import type { Rule } from "../types.js";
import { isModelSqlPath } from "../utils/model-paths.js";
import { report } from "../utils/report.js";

const HARDCODED_RELATION_PATTERN =
  /\b(from|join)\s+[`"\[]?[a-zA-Z_][\w$-]*[`"\]]?(?:\s*\.\s*[`"\[]?[a-zA-Z_][\w$-]*[`"\]]?){1,2}\b/gi;

export const scriptHasNoTableName: Rule = {
  id: "script-has-no-table-name",
  severity: "warn",
  category: "Architecture",
  tags: ["strict"],
  recommendation: "Avoid hardcoded relation names in model SQL.",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      if (!isModelSqlPath(file)) continue;
      const content = readFile(file);
      for (const match of content.matchAll(HARDCODED_RELATION_PATTERN)) {
        const snippet = (match[0] ?? "").replace(/\s+/g, " ").trim();
        diagnostics.push(
          report(
            scriptHasNoTableName,
            file,
            `Hardcoded relation reference detected: ${snippet}`,
            "Use {{ ref() }} / {{ source() }} for relation references in model SQL.",
          ),
        );
      }
    }
    return diagnostics;
  },
};
