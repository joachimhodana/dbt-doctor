import type { Rule } from "../types.js";
import { blockHasMetaKey, parseStringList } from "../utils/configurable-rule.js";
import { report } from "../utils/report.js";
import { splitNamedYamlBlocks } from "../utils/yaml-blocks.js";

export const seedHasMetaKeys: Rule = {
  id: "seed-has-meta-keys",
  severity: "warn",
  category: "Governance",
  recommendation:
    "Set `rules.seed-has-meta-keys.required` in .dbt-doctor to enforce required meta keys on seeds.",
  run: (context) => {
    const requiredKeys = parseStringList(context.ruleConfig.required);
    if (requiredKeys.length === 0) return [];

    const diagnostics = [];

    for (const file of context.yamlFiles) {
      if (!/\.(yml|yaml)$/i.test(file)) continue;
      const relative = file.replace(/\\/g, "/");
      if (!relative.includes("/seeds/") && !relative.startsWith("seeds/")) continue;

      for (const seed of splitNamedYamlBlocks(context.readFile(file), "seeds")) {
        const missing = requiredKeys.filter((key) => !blockHasMetaKey(seed.block, key));
        if (missing.length === 0) continue;

        diagnostics.push(
          report(
            seedHasMetaKeys,
            file,
            `Seed "${seed.name}" is missing required meta keys: ${missing.join(", ")}`,
            `Add meta keys: ${requiredKeys.join(", ")}.`,
          ),
        );
      }
    }

    return diagnostics;
  },
};
