import type { Rule } from "../types.js";
import { isModelSqlPath, isUnderModelsYaml, modelBaseName } from "../utils/model-paths.js";
import { report } from "../utils/report.js";
import { findModelBlock } from "../utils/yaml-blocks.js";

const hasUniquenessTest = (block: string): boolean =>
  /-\s+unique\b/i.test(block) ||
  /\bdbt_utils\.unique_combination_of_columns\b/i.test(block) ||
  /\bunique_combination_of_columns:\b/i.test(block);

export const modelHasUniquenessTest: Rule = {
  id: "model-has-uniqueness-test",
  severity: "warn",
  category: "Testing",
  recommendation: "Models should include a uniqueness test for key columns.",
  run: ({ sqlFiles, yamlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      if (!isModelSqlPath(file)) continue;
      const modelName = modelBaseName(file);
      const modelBlock = findModelBlock(modelName, yamlFiles, readFile, isUnderModelsYaml);
      if (!modelBlock || hasUniquenessTest(modelBlock.block)) continue;
      diagnostics.push(
        report(
          modelHasUniquenessTest,
          modelBlock.file,
          `Model "${modelName}" is missing a uniqueness test`,
          "Add unique or equivalent uniqueness tests to key columns.",
        ),
      );
    }
    return diagnostics;
  },
};
