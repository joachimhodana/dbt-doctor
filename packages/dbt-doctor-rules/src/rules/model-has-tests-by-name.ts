import type { Rule } from "../types.js";
import { parsePositiveCountMap } from "../utils/configurable-rule.js";
import { isModelSqlPath, isUnderModelsYaml, modelBaseName } from "../utils/model-paths.js";
import { findModelBlock } from "../utils/yaml-blocks.js";
import { report } from "../utils/report.js";
import { countTestReferences } from "../utils/test-references.js";

export const modelHasTestsByName: Rule = {
  id: "model-has-tests-by-name",
  severity: "warn",
  category: "Testing",
  recommendation:
    "Set `rules.model-has-tests-by-name.<test_name>=<count>` in .dbt-doctor to enforce minimum test counts.",
  run: (context) => {
    const requiredTests = parsePositiveCountMap(context.ruleConfig);
    if (Object.keys(requiredTests).length === 0) return [];

    const diagnostics = [];

    for (const file of context.sqlFiles) {
      if (!isModelSqlPath(file)) continue;

      const modelName = modelBaseName(file);
      const modelBlock = findModelBlock(modelName, context.yamlFiles, context.readFile, isUnderModelsYaml);

      if (!modelBlock) {
        diagnostics.push(
          report(
            modelHasTestsByName,
            file,
            `Model "${modelName}" is missing YAML required for model-has-tests-by-name checks`,
            "Add model YAML and declare tests to satisfy configured minimums.",
          ),
        );
        continue;
      }

      for (const [testName, requiredCount] of Object.entries(requiredTests)) {
        const actualCount = countTestReferences(modelBlock.block, testName);
        if (actualCount >= requiredCount) continue;

        diagnostics.push(
          report(
            modelHasTestsByName,
            modelBlock.file,
            `Model "${modelName}" requires at least ${requiredCount} ${testName} test(s), found ${actualCount}`,
            `Add ${testName} tests to satisfy model-has-tests-by-name (${requiredCount}).`,
          ),
        );
      }
    }

    return diagnostics;
  },
};
