import type { Rule } from "../types.js";
import { report } from "../utils/report.js";

export const noRunQueryInModel: Rule = {
  id: "no-run-query-in-model",
  severity: "error",
  category: "Architecture",
  recommendation: "Use refs and macros instead of run_query in models",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      if (!/\brun_query\s*\(/.test(readFile(file))) continue;
      diagnostics.push(
        report(
          noRunQueryInModel,
          file,
          "run_query() should not be used in model SQL",
          "Move imperative queries to macros or pre-hooks, not model files.",
        ),
      );
    }
    return diagnostics;
  },
};
