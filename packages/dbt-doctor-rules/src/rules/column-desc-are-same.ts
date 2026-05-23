import type { Rule } from "../types.js";
import { parseStringList } from "../utils/configurable-rule.js";
import { splitColumnBlocks } from "../utils/yaml-blocks.js";
import { report } from "../utils/report.js";

const extractDescription = (block: string): string | null => {
  const inline = block.match(/\bdescription:\s*['\"]?([^\n'\"]+)['\"]?/i)?.[1]?.trim();
  return inline && inline.length > 0 ? inline : null;
};

export const columnDescAreSame: Rule = {
  id: "column-desc-are-same",
  severity: "warn",
  category: "Documentation",
  recommendation:
    "Set `rules.column-desc-are-same.columns=col1,col2` to enforce consistent descriptions across models.",
  run: (context) => {
    const trackedColumns = new Set(parseStringList(context.ruleConfig.columns));
    if (trackedColumns.size === 0) return [];

    const seen = new Map<string, string>();
    const diagnostics = [];

    for (const file of context.yamlFiles) {
      if (!/\.(yml|yaml)$/i.test(file)) continue;
      const content = context.readFile(file);
      if (!/^\s*models:\s*$/m.test(content)) continue;

      for (const col of splitColumnBlocks(content)) {
        if (!trackedColumns.has(col.name)) continue;
        const description = extractDescription(col.block);
        if (!description) continue;

        const existing = seen.get(col.name);
        if (!existing) {
          seen.set(col.name, description);
          continue;
        }
        if (existing === description) continue;

        diagnostics.push(
          report(
            columnDescAreSame,
            file,
            `Column "${col.name}" has inconsistent descriptions across models`,
            `Use one canonical description for "${col.name}" across model YAML blocks.`,
          ),
        );
      }
    }

    return diagnostics;
  },
};
