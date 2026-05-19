import type { Rule } from "../types.js";
import { isStagingModelPath } from "../utils/path-layer.js";
import { report } from "../utils/report.js";

const TABLE_MATERIALIZATION =
  /\{\{-?\s*config\s*\([^)]*materialized\s*=\s*['"](table|incremental)['"]/i;

/**
 * Staging is typically views — tables add build time without business value.
 * @see https://docs.getdbt.com/best-practices/how-we-structure/2-staging
 */
export const stagingMaterializedView: Rule = {
  id: "staging-materialized-view",
  severity: "warn",
  category: "Configuration",
  recommendation: "Prefer view (or ephemeral) materialization for staging models",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      if (!isStagingModelPath(file)) continue;
      if (!TABLE_MATERIALIZATION.test(readFile(file))) continue;
      diagnostics.push(
        report(
          stagingMaterializedView,
          file,
          "Staging model is materialized as table/incremental",
          "Use {{ config(materialized='view') }} unless you have a documented exception.",
        ),
      );
    }
    return diagnostics;
  },
};
