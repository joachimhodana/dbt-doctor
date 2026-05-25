import type { Rule } from "../types.js";
import { parsePositiveCountMap } from "../utils/configurable-rule.js";
import { report } from "../utils/report.js";
import { listTestReferenceNames, singularTestMentionsSource } from "../utils/test-references.js";
import { splitSourceTableBlocks } from "../utils/yaml-blocks.js";

const countDataTests = (
  sourceName: string,
  tableName: string,
  testSqlFiles: string[],
  readFile: (path: string) => string,
): number => {
  let count = 0;
  for (const file of testSqlFiles) {
    if (singularTestMentionsSource(readFile(file), sourceName, tableName)) count += 1;
  }
  return count;
};

export const sourceHasTestsByType: Rule = {
  id: "source-has-tests-by-type",
  severity: "warn",
  category: "Testing",
  recommendation:
    "Set `rules.source-has-tests-by-type.schema=<n>` and/or `rules.source-has-tests-by-type.data=<n>` in .dbt-doctor.",
  run: ({ yamlFiles, readFile, testSqlFiles, ruleConfig }) => {
    const required = parsePositiveCountMap(ruleConfig, new Set(["schema", "data"]));
    if (Object.keys(required).length === 0) return [];

    const diagnostics = [];
    for (const file of yamlFiles) {
      const content = readFile(file);
      if (!/^\s*sources:\s*$/m.test(content)) continue;
      for (const table of splitSourceTableBlocks(content)) {
        const actualSchema = listTestReferenceNames(table.block).length;
        const actualData = countDataTests(table.sourceName, table.tableName, testSqlFiles, readFile);
        for (const [type, minCount] of Object.entries(required)) {
          const actual = type === "schema" ? actualSchema : type === "data" ? actualData : -1;
          if (actual < 0 || actual >= minCount) continue;
          diagnostics.push(
            report(
              sourceHasTestsByType,
              file,
              `Source "${table.sourceName}.${table.tableName}" requires at least ${minCount} ${type} test(s), found ${actual}`,
              `Add ${type} tests to satisfy source-has-tests-by-type (${minCount}).`,
            ),
          );
        }
      }
    }
    return diagnostics;
  },
};
