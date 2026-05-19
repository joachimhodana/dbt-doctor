import path from "node:path";
import type { Rule } from "../types.js";
import { isStagingModelPath } from "../utils/path-layer.js";
import { report } from "../utils/report.js";

/** dbt Labs style: stg_<source>__<entity> */
const STAGING_NAME_PATTERN = /^stg_[a-z0-9]+__[a-z0-9_]+$/;

export const stagingNamingConvention: Rule = {
  id: "staging-naming-convention",
  severity: "warn",
  category: "Naming",
  recommendation: "Name staging models stg_<source>__<entity> (double underscore)",
  run: ({ sqlFiles }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      if (!isStagingModelPath(file)) continue;
      const basename = path.basename(file, path.extname(file));
      if (!basename.startsWith("stg_")) continue;
      if (STAGING_NAME_PATTERN.test(basename)) continue;
      diagnostics.push(
        report(
          stagingNamingConvention,
          file,
          `Staging model "${basename}" should follow stg_<source>__<entity>`,
          "Example: stg_stripe__payments.sql — see dbt Labs naming guide.",
        ),
      );
    }
    return diagnostics;
  },
};
