import type { Rule } from "../types.js";
import { report } from "../utils/report.js";

export const noSelectStar: Rule = {
  id: "no-select-star",
  severity: "warn",
  category: "SQL Quality",
  recommendation: "List columns explicitly instead of SELECT *",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      if (!/\bselect\s+\*/i.test(readFile(file))) continue;
      diagnostics.push(
        report(
          noSelectStar,
          file,
          "Avoid SELECT * in dbt models",
          "List columns explicitly for stable contracts and clearer lineage.",
        ),
      );
    }
    return diagnostics;
  },
};
