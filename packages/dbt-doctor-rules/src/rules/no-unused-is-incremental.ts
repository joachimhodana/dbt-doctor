import type { Rule } from "../types.js";
import { isIncrementalModel } from "../utils/incremental-model.js";
import { isModelSqlPath, isUnderModelsYaml, modelBaseName } from "../utils/model-paths.js";
import { findModelBlock } from "../utils/yaml-blocks.js";
import { report } from "../utils/report.js";

const USES_IS_INCREMENTAL = /is_incremental\s*\(/i;

export const noUnusedIsIncremental: Rule = {
  id: "no-unused-is-incremental",
  severity: "warn",
  category: "Best Practices",
  tags: ["enterprise"],
  recommendation: "Remove is_incremental() from models that are not materialized as incremental",
  run: ({ sqlFiles, yamlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      if (!isModelSqlPath(file)) continue;
      const sql = readFile(file);
      if (!USES_IS_INCREMENTAL.test(sql)) continue;
      const name = modelBaseName(file);
      const yaml = findModelBlock(name, yamlFiles, readFile, isUnderModelsYaml);
      if (isIncrementalModel(sql, yaml?.block ?? null)) continue;
      diagnostics.push(
        report(
          noUnusedIsIncremental,
          file,
          `Model "${name}" calls is_incremental() but is not configured as incremental`,
          "Use materialized='incremental' (or YAML materialized: incremental), or remove dead is_incremental() branches.",
        ),
      );
    }
    return diagnostics;
  },
};
