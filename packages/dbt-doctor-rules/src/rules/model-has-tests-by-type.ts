import type { Rule } from "../types.js";
import { parsePositiveCountMap } from "../utils/configurable-rule.js";
import { isModelSqlPath, isUnderModelsYaml, modelBaseName } from "../utils/model-paths.js";
import { findModelBlock } from "../utils/yaml-blocks.js";
import { report } from "../utils/report.js";
import { listTestReferenceNames, singularTestMentionsModel } from "../utils/test-references.js";

const countSchemaTests = (modelBlock: string): number => listTestReferenceNames(modelBlock).length;

const countDataTests = (
  modelName: string,
  testSqlFiles: string[],
  readFile: (path: string) => string,
): number => {
  let count = 0;
  for (const file of testSqlFiles) {
    const content = readFile(file);
    if (singularTestMentionsModel(content, modelName)) count += 1;
  }
  return count;
};

export const modelHasTestsByType: Rule = {
  id: "model-has-tests-by-type",
  severity: "warn",
  category: "Testing",
  recommendation:
    "Set `rules.model-has-tests-by-type.schema=<n>` and/or `rules.model-has-tests-by-type.data=<n>` in .dbt-doctor.",
  run: (context) => {
    const required = parsePositiveCountMap(context.ruleConfig, new Set(["schema", "data"]));
    if (Object.keys(required).length === 0) return [];

    const diagnostics = [];

    for (const file of context.sqlFiles) {
      if (!isModelSqlPath(file)) continue;
      const modelName = modelBaseName(file);
      const modelBlock = findModelBlock(
        modelName,
        context.yamlFiles,
        context.readFile,
        isUnderModelsYaml,
      );

      const actualSchema = modelBlock ? countSchemaTests(modelBlock.block) : 0;
      const actualData = countDataTests(modelName, context.testSqlFiles, context.readFile);

      for (const [testType, minCount] of Object.entries(required)) {
        const actualCount =
          testType === "data" ? actualData : testType === "schema" ? actualSchema : -1;
        if (actualCount < 0 || actualCount >= minCount) continue;

        diagnostics.push(
          report(
            modelHasTestsByType,
            modelBlock?.file ?? file,
            `Model "${modelName}" requires at least ${minCount} ${testType} test(s), found ${actualCount}`,
            `Add ${testType} tests to satisfy model-has-tests-by-type (${minCount}).`,
          ),
        );
      }
    }

    return diagnostics;
  },
};
