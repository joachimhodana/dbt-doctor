import type { Rule } from "../types.js";
import { extractTags, parseStringList } from "../utils/configurable-rule.js";
import { report } from "../utils/report.js";
import { splitSourceTableBlocks } from "../utils/yaml-blocks.js";

export const sourceTags: Rule = {
  id: "source-tags",
  severity: "warn",
  category: "Governance",
  recommendation:
    "Set `rules.source-tags.allowed` in .dbt-doctor to enforce allowed source table tags.",
  run: (context) => {
    const allowedTags = parseStringList(context.ruleConfig.allowed);
    if (allowedTags.length === 0) return [];

    const allowedSet = new Set(allowedTags);
    const diagnostics = [];

    for (const file of context.yamlFiles) {
      if (!/\.(yml|yaml)$/i.test(file)) continue;
      const content = context.readFile(file);
      if (!/^\s*sources:\s*$/m.test(content)) continue;

      for (const table of splitSourceTableBlocks(content)) {
        const tags = extractTags(table.block);
        const hasAllowedTag = [...tags].some((tag) => allowedSet.has(tag));
        if (hasAllowedTag) continue;

        diagnostics.push(
          report(
            sourceTags,
            file,
            `Source table "${table.sourceName}.${table.tableName}" is missing an allowed tag (${allowedTags.join(", ")})`,
            `Add at least one allowed tag: ${allowedTags.join(", ")}.`,
          ),
        );
      }
    }

    return diagnostics;
  },
};
