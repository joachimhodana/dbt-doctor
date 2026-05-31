import type { Rule } from "../types.js";
import { blockHasMetaKey, parseStringList } from "../utils/configurable-rule.js";
import { report } from "../utils/report.js";
import { splitSourceTableBlocks } from "../utils/yaml-blocks.js";

export const sourceHasMetaKeys: Rule = {
  id: "source-has-meta-keys",
  severity: "warn",
  category: "Governance",
  recommendation:
    "Set `rules.source-has-meta-keys.required` in .dbt-doctor to enforce required meta keys on source tables.",
  run: (context) => {
    const requiredKeys = parseStringList(context.ruleConfig.required);
    if (requiredKeys.length === 0) return [];

    const diagnostics = [];

    for (const file of context.yamlFiles) {
      if (!/\.(yml|yaml)$/i.test(file)) continue;
      const content = context.readFile(file);
      if (!/^\s*sources:\s*$/m.test(content)) continue;

      for (const table of splitSourceTableBlocks(content)) {
        const missing = requiredKeys.filter((key) => !blockHasMetaKey(table.block, key));
        if (missing.length === 0) continue;

        diagnostics.push(
          report(
            sourceHasMetaKeys,
            file,
            `Source table "${table.sourceName}.${table.tableName}" is missing required meta keys: ${missing.join(", ")}`,
            `Add meta keys: ${requiredKeys.join(", ")}.`,
          ),
        );
      }
    }

    return diagnostics;
  },
};
