import type { Rule } from "../types.js";
import { parsePositiveCountMap } from "../utils/configurable-rule.js";
import { report } from "../utils/report.js";
import { listTestReferenceNames } from "../utils/test-references.js";
import { splitSourceTableBlocks } from "../utils/yaml-blocks.js";

const GROUPS: Record<string, ReadonlyArray<string>> = {
  uniqueness: ["unique", "unique_combination_of_columns"],
  nullness: ["not_null"],
  relationships: ["relationships"],
  accepted_values: ["accepted_values"],
};

const countGroupMatches = (names: string[], group: string): number => {
  const allowed = new Set(GROUPS[group]);
  return names.filter((name) => allowed.has(name)).length;
};

export const sourceHasTestsByGroup: Rule = {
  id: "source-has-tests-by-group",
  severity: "warn",
  category: "Testing",
  recommendation:
    "Set `rules.source-has-tests-by-group.<group>=<n>` (groups: uniqueness, nullness, relationships, accepted_values).",
  run: ({ yamlFiles, readFile, ruleConfig }) => {
    const required = parsePositiveCountMap(ruleConfig, new Set(Object.keys(GROUPS)));
    if (Object.keys(required).length === 0) return [];

    const diagnostics = [];
    for (const file of yamlFiles) {
      const content = readFile(file);
      if (!/^\s*sources:\s*$/m.test(content)) continue;
      for (const table of splitSourceTableBlocks(content)) {
        const names = listTestReferenceNames(table.block);
        for (const [group, minCount] of Object.entries(required)) {
          const actual = countGroupMatches(names, group);
          if (actual >= minCount) continue;
          diagnostics.push(
            report(
              sourceHasTestsByGroup,
              file,
              `Source "${table.sourceName}.${table.tableName}" requires at least ${minCount} ${group} test(s), found ${actual}`,
              `Add ${group} tests to satisfy source-has-tests-by-group (${minCount}).`,
            ),
          );
        }
      }
    }
    return diagnostics;
  },
};
