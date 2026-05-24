import type { Rule } from "../types.js";
import { parseStringList } from "../utils/configurable-rule.js";
import { isModelSqlPath, isUnderModelsYaml, modelBaseName } from "../utils/model-paths.js";
import { findModelBlock } from "../utils/yaml-blocks.js";
import { report } from "../utils/report.js";

const hasLabelKey = (block: string, key: string): boolean => {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\blabels:\\s*\\n[\\s\\S]*?\\b${escaped}:\\s*\\S`, "i").test(block);
};

export const modelHasLabelsKeys: Rule = {
  id: "model-has-labels-keys",
  severity: "warn",
  category: "Governance",
  recommendation:
    "Set `rules.model-has-labels-keys.required` in .dbt-doctor to enforce required labels keys.",
  run: (context) => {
    const requiredKeys = parseStringList(context.ruleConfig.required);
    if (requiredKeys.length === 0) return [];

    const diagnostics = [];
    for (const file of context.sqlFiles) {
      if (!isModelSqlPath(file)) continue;
      const modelName = modelBaseName(file);
      const modelBlock = findModelBlock(
        modelName,
        context.yamlFiles,
        context.readFile,
        isUnderModelsYaml,
      );
      if (!modelBlock) continue;

      const missing = requiredKeys.filter((key) => !hasLabelKey(modelBlock.block, key));
      if (missing.length === 0) continue;

      diagnostics.push(
        report(
          modelHasLabelsKeys,
          modelBlock.file,
          `Model "${modelName}" is missing required labels keys: ${missing.join(", ")}`,
          `Add labels keys: ${requiredKeys.join(", ")}.`,
        ),
      );
    }
    return diagnostics;
  },
};
