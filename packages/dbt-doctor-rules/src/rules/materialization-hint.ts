import type { Rule } from "../types.js";
import { hasMaterializedConfig } from "../utils/incremental-model.js";
import { isModelSqlPath, isUnderModelsYaml, modelBaseName } from "../utils/model-paths.js";
import { findModelBlock } from "../utils/yaml-blocks.js";
import { report } from "../utils/report.js";

export const materializationHint: Rule = {
  id: "materialization-hint",
  severity: "warn",
  category: "Configuration",
  tags: ["style"],
  recommendation: "Set explicit materialization for large models",
  run: ({ sqlFiles, yamlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      if (!isModelSqlPath(file)) continue;
      const content = readFile(file);
      if (content.split("\n").length < 80) continue;

      const name = modelBaseName(file);
      const yaml = findModelBlock(name, yamlFiles, readFile, isUnderModelsYaml);
      const yamlText = yaml?.block ?? null;
      if (hasMaterializedConfig(content, yamlText)) continue;

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
