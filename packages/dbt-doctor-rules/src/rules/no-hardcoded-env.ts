import type { Rule } from "../types.js";
import { HARDCODED_ENV_PATTERN } from "../constants.js";
import { isModelSqlPath } from "../utils/model-paths.js";
import { report } from "../utils/report.js";

export const noHardcodedEnv: Rule = {
  id: "no-hardcoded-env",
  severity: "error",
  category: "Governance",
  tags: ["enterprise"],
  recommendation: "Avoid hardcoded environment or project names in model SQL",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      if (!isModelSqlPath(file)) continue;
      const content = readFile(file);
      const matches = content.match(HARDCODED_ENV_PATTERN);
      if (!matches?.length) continue;
      const sample = [...new Set(matches)].slice(0, 3).join(", ");
      diagnostics.push(
        report(
          noHardcodedEnv,
          file,
          `Model may hardcode environment-specific identifiers (${sample})`,
          "Use {{ ref() }}, {{ source() }}, or env_var() / target.name instead of prod_/dev_ literals.",
        ),
      );
    }
    return diagnostics;
  },
};
