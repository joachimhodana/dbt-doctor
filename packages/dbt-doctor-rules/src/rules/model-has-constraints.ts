import type { Rule } from "../types.js";
import { isModelSqlPath, isUnderModelsYaml, modelBaseName } from "../utils/model-paths.js";
import { findModelBlock } from "../utils/yaml-blocks.js";
import { report } from "../utils/report.js";

export const modelHasConstraints: Rule = {
  id: "model-has-constraints",
  severity: "warn",
  category: "Governance",
  recommendation: "Set constraints on models/columns in schema YAML.",
  run: (context) => {
    if (context.ruleConfig.enabled !== true) return [];
    const diagnostics = [];

    for (const file of context.sqlFiles) {
      if (!isModelSqlPath(file)) continue;
      const modelName = modelBaseName(file);
      const modelBlock = findModelBlock(modelName, context.yamlFiles, context.readFile, isUnderModelsYaml);
      if (!modelBlock) continue;
      if (/\bconstraints:\s*/i.test(modelBlock.block)) continue;

      diagnostics.push(
        report(
          modelHasConstraints,
          modelBlock.file,
          `Model "${modelName}" has no constraints defined`,
          "Add constraints under model or columns in schema YAML.",
        ),
      );
    }
    return diagnostics;
  },
};
