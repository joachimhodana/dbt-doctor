import type { Rule } from "../types.js";
import { isModelSqlPath, isUnderModelsYaml, modelBaseName } from "../utils/model-paths.js";
import { findModelBlock } from "../utils/yaml-blocks.js";
import { report } from "../utils/report.js";

const GENERIC_CONSTRAINT_PATTERN = /\b(not_null|unique|primary_key|foreign_key|check)\b/i;

export const modelHasGenericConstraints: Rule = {
  id: "model-has-generic-constraints",
  severity: "warn",
  category: "Governance",
  recommendation: "Use generic constraints (not_null, unique, primary_key, foreign_key, check) in YAML.",
  run: (context) => {
    if (context.ruleConfig.enabled !== true) return [];
    const diagnostics = [];

    for (const file of context.sqlFiles) {
      if (!isModelSqlPath(file)) continue;
      const modelName = modelBaseName(file);
      const modelBlock = findModelBlock(modelName, context.yamlFiles, context.readFile, isUnderModelsYaml);
      if (!modelBlock) continue;
      if (GENERIC_CONSTRAINT_PATTERN.test(modelBlock.block)) continue;

      diagnostics.push(
        report(
          modelHasGenericConstraints,
          modelBlock.file,
          `Model "${modelName}" has no generic constraints defined`,
          "Add generic constraints in schema YAML (for example not_null/unique).",
        ),
      );
    }
    return diagnostics;
  },
};
