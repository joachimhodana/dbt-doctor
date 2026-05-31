import type { Rule } from "../types.js";
import { blockHasMetaKey, parseStringList } from "../utils/configurable-rule.js";
import { isUnderModelsYaml } from "../utils/model-paths.js";
import { report } from "../utils/report.js";
import { splitColumnBlocks, splitNamedYamlBlocks } from "../utils/yaml-blocks.js";

export const modelColumnsHaveMetaKeys: Rule = {
  id: "model-columns-have-meta-keys",
  severity: "warn",
  category: "Governance",
  tags: ["strict"],
  recommendation:
    "Set `rules.model-columns-have-meta-keys.required` to enforce required column-level meta keys.",
  run: ({ yamlFiles, readFile, ruleConfig }) => {
    const requiredKeys = parseStringList(ruleConfig.required);
    if (requiredKeys.length === 0) return [];

    const diagnostics = [];

    for (const file of yamlFiles) {
      if (!isUnderModelsYaml(file)) continue;
      const content = readFile(file);
      for (const model of splitNamedYamlBlocks(content, "models")) {
        for (const column of splitColumnBlocks(model.block)) {
          const missing = requiredKeys.filter((key) => !blockHasMetaKey(column.block, key));
          if (missing.length === 0) continue;

          diagnostics.push(
            report(
              modelColumnsHaveMetaKeys,
              file,
              `Column "${column.name}" in model "${model.name}" is missing required meta keys: ${missing.join(", ")}`,
              `Add meta keys on the column: ${requiredKeys.join(", ")}.`,
            ),
          );
        }
      }
    }

    return diagnostics;
  },
};
