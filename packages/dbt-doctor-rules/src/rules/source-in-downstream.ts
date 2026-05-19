import type { Rule } from "../types.js";
import { isDownstreamModelPath } from "../utils/path-layer.js";
import { report } from "../utils/report.js";

const SOURCE_CALL_PATTERN = /\{\{-?\s*source\s*\(/;

/**
 * Mirrors dbt_project_evaluator `fct_marts_or_intermediate_dependent_on_source`.
 * @see https://docs.getdbt.com/best-practices/how-we-structure/2-staging
 */
export const sourceInDownstream: Rule = {
  id: "source-in-downstream",
  severity: "error",
  category: "Architecture",
  recommendation:
    "Reference raw data only in staging via {{ source() }}; downstream layers use {{ ref() }}",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      if (!isDownstreamModelPath(file)) continue;
      if (!SOURCE_CALL_PATTERN.test(readFile(file))) continue;
      diagnostics.push(
        report(
          sourceInDownstream,
          file,
          "Marts/intermediate model uses {{ source() }} — add or use a staging model",
          "Create stg_<source>__<entity> that selects from source(), then ref() it downstream.",
        ),
      );
    }
    return diagnostics;
  },
};
