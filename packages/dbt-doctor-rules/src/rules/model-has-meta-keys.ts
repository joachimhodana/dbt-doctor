import type { Rule } from "../types.js";
import { blockHasMetaKey, parseStringList } from "../utils/configurable-rule.js";
import { isModelSqlPath, isUnderModelsYaml, modelBaseName } from "../utils/model-paths.js";
import { findModelBlock } from "../utils/yaml-blocks.js";
import { report } from "../utils/report.js";

export const modelHasMetaKeys: Rule = {
  id: "model-has-meta-keys",
  severity: "warn",
  category: "Governance",
  recommendation:
    "Set `rules.model-has-meta-keys.required` in .dbt-doctor to enforce required model meta keys.",
  run: (context) => {
    const requiredKeys = parseStringList(context.ruleConfig.required);
    if (requiredKeys.length === 0) return [];

    const diagnostics = [];

    for (const file of context.sqlFiles) {
      if (!isModelSqlPath(file)) continue;

      const modelName = modelBaseName(file);
      const modelBlock = findModelBlock(modelName, context.yamlFiles, context.readFile, isUnderModelsYaml);

      if (!modelBlock) {
        diagnostics.push(
          report(
            modelHasMetaKeys,
            file,
            `Model "${modelName}" is missing YAML required for model-has-meta-keys checks`,
            "Add model YAML and include the required meta keys.",
          ),
        );
        continue;
      }

      const missing = requiredKeys.filter((key) => !blockHasMetaKey(modelBlock.block, key));
      if (missing.length === 0) continue;

      diagnostics.push(
        report(
          modelHasMetaKeys,
          modelBlock.file,
          `Model "${modelName}" is missing required meta keys: ${missing.join(", ")}`,
          `Add meta keys: ${requiredKeys.join(", ")}.`,
        ),
      );
    }

    return diagnostics;
  },
};
