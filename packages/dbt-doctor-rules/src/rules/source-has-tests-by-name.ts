import type { Rule } from "../types.js";
import { parsePositiveCountMap } from "../utils/configurable-rule.js";
import { report } from "../utils/report.js";
import { countTestReferences } from "../utils/test-references.js";
import { splitSourceTableBlocks } from "../utils/yaml-blocks.js";

export const sourceHasTestsByName: Rule = {
  id: "source-has-tests-by-name",
  severity: "warn",
  category: "Testing",
  recommendation:
    "Set `rules.source-has-tests-by-name.<test_name>=<count>` in .dbt-doctor to enforce source test minimums.",
  run: ({ yamlFiles, readFile, ruleConfig }) => {
    const requiredTests = parsePositiveCountMap(ruleConfig);
    if (Object.keys(requiredTests).length === 0) return [];

    const diagnostics = [];
    for (const file of yamlFiles) {
      const content = readFile(file);
      if (!/^\s*sources:\s*$/m.test(content)) continue;
      for (const table of splitSourceTableBlocks(content)) {
        for (const [testName, minCount] of Object.entries(requiredTests)) {
          const actual = countTestReferences(table.block, testName);
          if (actual >= minCount) continue;
          diagnostics.push(
            report(
              sourceHasTestsByName,
              file,
              `Source "${table.sourceName}.${table.tableName}" requires at least ${minCount} ${testName} test(s), found ${actual}`,
              `Add ${testName} tests to satisfy source-has-tests-by-name (${minCount}).`,
            ),
          );
        }
      }
    }
    return diagnostics;
  },
};
