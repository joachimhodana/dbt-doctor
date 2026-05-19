import type { Rule } from "../types.js";
import { report } from "../utils/report.js";

export const materializationHint: Rule = {
  id: "materialization-hint",
  severity: "warn",
  category: "Configuration",
  tags: ["style"],
  recommendation: "Set explicit materialization for large models",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      const content = readFile(file);
      if (content.split("\n").length < 80) continue;
      if (/\{\{\s*config\s*\([^)]*materialized/.test(content)) continue;
      diagnostics.push(
        report(
          materializationHint,
          file,
          "Large model has no explicit materialization config",
          "Add {{ config(materialized='table'|'incremental') }} as appropriate.",
        ),
      );
    }
    return diagnostics;
  },
};
