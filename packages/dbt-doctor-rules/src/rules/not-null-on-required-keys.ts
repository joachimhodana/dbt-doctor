import type { Rule } from "../types.js";
import { FOREIGN_KEY_COLUMN_PATTERN } from "../constants.js";
import { isMartModelPath } from "../utils/path-layer.js";
import { isModelSqlPath, isUnderModelsYaml, modelBaseName } from "../utils/model-paths.js";
import { blockHasTest, findModelBlock, splitColumnBlocks } from "../utils/yaml-blocks.js";
import { report } from "../utils/report.js";

export const notNullOnRequiredKeys: Rule = {
  id: "not-null-on-required-keys",
  severity: "warn",
  category: "Testing",
  tags: ["enterprise"],
  recommendation: "Primary and foreign key columns should have not_null tests",
  run: ({ sqlFiles, yamlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      if (!isModelSqlPath(file) || !isMartModelPath(file)) continue;
      const name = modelBaseName(file);
      const yaml = findModelBlock(name, yamlFiles, readFile, isUnderModelsYaml);
      if (!yaml) continue;
      for (const column of splitColumnBlocks(yaml.block)) {
        if (!FOREIGN_KEY_COLUMN_PATTERN.test(column.name)) continue;
        if (blockHasTest(column.block, "not_null")) continue;
        diagnostics.push(
          report(
            notNullOnRequiredKeys,
            file,
            `Column "${column.name}" on "${name}" should have a not_null test`,
            "Add not_null under tests for key columns.",
          ),
        );
      }
    }
    return diagnostics;
  },
};
