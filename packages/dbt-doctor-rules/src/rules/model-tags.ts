import type { Rule } from "../types.js";
import { isModelSqlPath, isUnderModelsYaml, modelBaseName } from "../utils/model-paths.js";
import { extractTags, parseStringList } from "../utils/configurable-rule.js";
import { findModelBlock } from "../utils/yaml-blocks.js";
import { report } from "../utils/report.js";

export const modelTags: Rule = {
  id: "model-tags",
  severity: "warn",
  category: "Governance",
  recommendation: "Set `rules.model-tags.allowed` in .dbt-doctor to enforce allowed model tags.",
  run: (context) => {
    const allowedTags = parseStringList(context.ruleConfig.allowed);
    if (allowedTags.length === 0) return [];

    const allowedSet = new Set(allowedTags);
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
      if (!modelBlock) {
        diagnostics.push(
          report(
            modelTags,
            file,
            `Model "${modelName}" is missing YAML required for model-tags checks`,
            "Add model YAML and include an allowed tag.",
          ),
        );
        continue;
      }

      const tags = extractTags(modelBlock.block);
      const hasAllowedTag = [...tags].some((tag) => allowedSet.has(tag));
      if (hasAllowedTag) continue;

      diagnostics.push(
        report(
          modelTags,
          modelBlock.file,
          `Model "${modelName}" is missing an allowed tag (${allowedTags.join(", ")})`,
          `Add at least one allowed tag: ${allowedTags.join(", ")}.`,
        ),
      );
    }

    return diagnostics;
  },
};
