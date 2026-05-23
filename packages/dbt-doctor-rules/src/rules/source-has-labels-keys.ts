import type { Rule } from "../types.js";
import { parseStringList } from "../utils/configurable-rule.js";
import { report } from "../utils/report.js";
import { splitNamedYamlBlocks } from "../utils/yaml-blocks.js";

const hasLabelKey = (block: string, key: string): boolean => {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\blabels:\\s*\\n[\\s\\S]*?\\b${escaped}:\\s*\\S`, "i").test(block);
};

export const sourceHasLabelsKeys: Rule = {
  id: "source-has-labels-keys",
  severity: "warn",
  category: "Governance",
  recommendation:
    "Set `rules.source-has-labels-keys.required` in .dbt-doctor to enforce required labels keys on sources.",
  run: (context) => {
    const requiredKeys = parseStringList(context.ruleConfig.required);
    if (requiredKeys.length === 0) return [];

    const diagnostics = [];

    for (const file of context.yamlFiles) {
      if (!/\.(yml|yaml)$/i.test(file)) continue;
      const content = context.readFile(file);
      if (!/^\s*sources:\s*$/m.test(content)) continue;

      for (const source of splitNamedYamlBlocks(content, "sources")) {
        const missing = requiredKeys.filter((key) => !hasLabelKey(source.block, key));
        if (missing.length === 0) continue;

        diagnostics.push(
          report(
            sourceHasLabelsKeys,
            file,
            `Source "${source.name}" is missing required labels keys: ${missing.join(", ")}`,
            `Add labels keys: ${requiredKeys.join(", ")}.`,
          ),
        );
      }
    }

    return diagnostics;
  },
};
