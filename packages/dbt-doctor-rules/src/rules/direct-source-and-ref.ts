import type { Rule } from "../types.js";
import { report } from "../utils/report.js";

const SOURCE_CALL_PATTERN = /\{\{-?\s*source\s*\(/;
const REF_CALL_PATTERN = /\{\{-?\s*ref\s*\(/;

/**
 * Mirrors dbt_project_evaluator `fct_direct_join_to_source`.
 * @see https://dbt-labs.github.io/dbt-project-evaluator/main/rules/modeling/
 */
export const directSourceAndRef: Rule = {
  id: "direct-source-and-ref",
  severity: "error",
  category: "Architecture",
  recommendation: "Do not mix {{ source() }} and {{ ref() }} in one model — stage sources first",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      const content = readFile(file);
      if (!SOURCE_CALL_PATTERN.test(content) || !REF_CALL_PATTERN.test(content)) continue;
      diagnostics.push(
        report(
          directSourceAndRef,
          file,
          "Model references both {{ source() }} and {{ ref() }} in the same file",
          "Join staging models with ref() instead of reading a source beside other refs.",
        ),
      );
    }
    return diagnostics;
  },
};
