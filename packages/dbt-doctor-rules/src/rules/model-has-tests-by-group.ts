import type { Rule } from "../types.js";
import { parsePositiveCountMap } from "../utils/configurable-rule.js";
import { isModelSqlPath, isUnderModelsYaml, modelBaseName } from "../utils/model-paths.js";
import { findModelBlock } from "../utils/yaml-blocks.js";
import { report } from "../utils/report.js";
import { listTestReferenceNames } from "../utils/test-references.js";

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

export const modelHasTestsByGroup: Rule = {
  id: "model-has-tests-by-group",
  severity: "warn",
  category: "Testing",
  recommendation:
    "Set `rules.model-has-tests-by-group.<group>=<n>` (groups: uniqueness, nullness, relationships, accepted_values).",
  run: (context) => {
    const required = parsePositiveCountMap(context.ruleConfig, new Set(Object.keys(GROUPS)));
    if (Object.keys(required).length === 0) return [];

    const diagnostics = [];

    for (const file of context.sqlFiles) {
      if (!isModelSqlPath(file)) continue;
      const modelName = modelBaseName(file);
      const modelBlock = findModelBlock(modelName, context.yamlFiles, context.readFile, isUnderModelsYaml);

      if (!modelBlock) {
        diagnostics.push(
          report(
            modelHasTestsByGroup,
            file,
            `Model "${modelName}" is missing YAML required for model-has-tests-by-group checks`,
            "Add model YAML and declare tests for required groups.",
          ),
        );
        continue;
      }

      const names = listTestReferenceNames(modelBlock.block);
      for (const [group, minCount] of Object.entries(required)) {
        const actualCount = countGroupMatches(names, group);
        if (actualCount >= minCount) continue;

        diagnostics.push(
          report(
            modelHasTestsByGroup,
            modelBlock.file,
            `Model "${modelName}" requires at least ${minCount} ${group} test(s), found ${actualCount}`,
            `Add ${group} tests to satisfy model-has-tests-by-group (${minCount}).`,
          ),
        );
      }
    }

    return diagnostics;
  },
};
