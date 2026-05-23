import type { Rule } from "../types.js";
import { blockHasMetaKey, parseStringList } from "../utils/configurable-rule.js";
import { report } from "../utils/report.js";
import { splitNamedYamlBlocks } from "../utils/yaml-blocks.js";

export const exposureHasMetaKeys: Rule = {
  id: "exposure-has-meta-keys",
  severity: "warn",
  category: "Governance",
  recommendation:
    "Set `rules.exposure-has-meta-keys.required` in .dbt-doctor to enforce required meta keys on exposures.",
  run: (context) => {
    const requiredKeys = parseStringList(context.ruleConfig.required);
    if (requiredKeys.length === 0) return [];

    const diagnostics = [];

    for (const file of context.yamlFiles) {
      if (!/\.(yml|yaml)$/i.test(file)) continue;

      for (const exposure of splitNamedYamlBlocks(context.readFile(file), "exposures")) {
        const missing = requiredKeys.filter((key) => !blockHasMetaKey(exposure.block, key));
        if (missing.length === 0) continue;

        diagnostics.push(
          report(
            exposureHasMetaKeys,
            file,
            `Exposure "${exposure.name}" is missing required meta keys: ${missing.join(", ")}`,
            `Add meta keys: ${requiredKeys.join(", ")}.`,
          ),
        );
      }
    }

    return diagnostics;
  },
};
