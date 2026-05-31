import type { Rule } from "../types.js";
import { blockHasMetaKey, parseStringList } from "../utils/configurable-rule.js";
import { report } from "../utils/report.js";
import { splitNamedYamlBlocks } from "../utils/yaml-blocks.js";

export const snapshotHasMetaKeys: Rule = {
  id: "snapshot-has-meta-keys",
  severity: "warn",
  category: "Governance",
  recommendation:
    "Set `rules.snapshot-has-meta-keys.required` in .dbt-doctor to enforce required meta keys on snapshots.",
  run: (context) => {
    const requiredKeys = parseStringList(context.ruleConfig.required);
    if (requiredKeys.length === 0) return [];

    const diagnostics = [];

    for (const file of context.yamlFiles) {
      if (!/\.(yml|yaml)$/i.test(file)) continue;

      for (const snap of splitNamedYamlBlocks(context.readFile(file), "snapshots")) {
        const missing = requiredKeys.filter((key) => !blockHasMetaKey(snap.block, key));
        if (missing.length === 0) continue;

        diagnostics.push(
          report(
            snapshotHasMetaKeys,
            file,
            `Snapshot "${snap.name}" is missing required meta keys: ${missing.join(", ")}`,
            `Add meta keys: ${requiredKeys.join(", ")}.`,
          ),
        );
      }
    }

    return diagnostics;
  },
};
