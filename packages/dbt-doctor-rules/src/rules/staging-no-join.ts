import type { Rule } from "../types.js";
import { isStagingModelPath } from "../utils/path-layer.js";
import { report } from "../utils/report.js";

const JOIN_PATTERN = /\b(cross\s+join|inner\s+join|left\s+join|right\s+join|full\s+join|join)\b/i;

/**
 * Staging should rename/recast only — joins belong in intermediate/marts.
 * @see https://docs.getdbt.com/best-practices/how-we-structure/2-staging
 */
export const stagingNoJoin: Rule = {
  id: "staging-no-join",
  severity: "warn",
  category: "Architecture",
  recommendation: "Avoid joins in staging; combine entities in intermediate or marts",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      if (!isStagingModelPath(file)) continue;
      const content = readFile(file);
      if (!JOIN_PATTERN.test(content)) continue;
      diagnostics.push(
        report(
          stagingNoJoin,
          file,
          "Staging model contains a JOIN — prefer one staging model per source entity",
          "Move joins to an int_ model, then build marts from refs.",
        ),
      );
    }
    return diagnostics;
  },
};
