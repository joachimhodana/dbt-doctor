import type { Rule } from "../types.js";
import { report } from "../utils/report.js";

export const refOverSource: Rule = {
  id: "prefer-ref-over-raw-source",
  severity: "error",
  category: "Architecture",
  recommendation: "Use {{ ref() }} for model dependencies",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      const content = readFile(file);
      if (!/\bfrom\s+[\w.]+\.[\w.]+\.[\w.]+/i.test(content)) continue;
      if (/\{\{\s*ref\(/.test(content)) continue;
      diagnostics.push(
        report(
          refOverSource,
          file,
          "Model may reference another relation without ref()",
          "Use {{ ref('model_name') }} for dbt lineage and environment safety.",
        ),
      );
    }
    return diagnostics;
  },
};
