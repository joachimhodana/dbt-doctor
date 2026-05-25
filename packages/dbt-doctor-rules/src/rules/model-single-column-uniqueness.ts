import type { Rule } from "../types.js";
import { isModelSqlPath, isUnderModelsYaml, modelBaseName } from "../utils/model-paths.js";
import { report } from "../utils/report.js";
import { findModelBlock } from "../utils/yaml-blocks.js";

const hasSingleColumnUniqueTest = (block: string): boolean =>
  /-\s+unique\b/i.test(block) || /\bdbt_utils\.unique_combination_of_columns\b/i.test(block);

export const modelSingleColumnUniqueness: Rule = {
  id: "model-single-column-uniqueness",
  severity: "warn",
  category: "Testing",
  recommendation: "At least one uniqueness test should exist at column level.",
  run: ({ sqlFiles, yamlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      if (!isModelSqlPath(file)) continue;
      const modelName = modelBaseName(file);
      const modelBlock = findModelBlock(modelName, yamlFiles, readFile, isUnderModelsYaml);
      if (!modelBlock || hasSingleColumnUniqueTest(modelBlock.block)) continue;
      diagnostics.push(
        report(
          modelSingleColumnUniqueness,
          modelBlock.file,
          `Model "${modelName}" has no uniqueness test at column/model level`,
          "Add unique (or equivalent uniqueness test) to key columns.",
        ),
      );
    }
    return diagnostics;
  },
};
