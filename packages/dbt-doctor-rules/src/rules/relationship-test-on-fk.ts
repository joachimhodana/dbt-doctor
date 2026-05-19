import type { Rule } from "../types.js";
import { FOREIGN_KEY_COLUMN_PATTERN } from "../constants.js";
import { isMartModelPath } from "../utils/path-layer.js";
import { isModelSqlPath, isUnderModelsYaml, modelBaseName } from "../utils/model-paths.js";
import { blockHasRelationshipTest, findModelBlock, splitColumnBlocks } from "../utils/yaml-blocks.js";
import { report } from "../utils/report.js";

export const relationshipTestOnFk: Rule = {
  id: "relationship-test-on-fk",
  severity: "warn",
  category: "Testing",
  tags: ["enterprise"],
  recommendation: "Add relationships tests on foreign-key-style columns",
  run: ({ sqlFiles, yamlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      if (!isModelSqlPath(file) || !isMartModelPath(file)) continue;
      const name = modelBaseName(file);
      const yaml = findModelBlock(name, yamlFiles, readFile, isUnderModelsYaml);
      if (!yaml) continue;
      for (const column of splitColumnBlocks(yaml.block)) {
        if (!FOREIGN_KEY_COLUMN_PATTERN.test(column.name)) continue;
        if (column.name === "id") continue;
        if (blockHasRelationshipTest(column.block)) continue;
        diagnostics.push(
          report(
            relationshipTestOnFk,
            file,
            `Column "${column.name}" on "${name}" may need a relationships test`,
            "Add a relationships test to validate referential integrity.",
          ),
        );
      }
    }
    return diagnostics;
  },
};
