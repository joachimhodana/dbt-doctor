import type { Rule } from "../types.js";
import { isUnderModelsYaml } from "../utils/model-paths.js";
import {
  blockHasDescription,
  splitColumnBlocks,
  splitNamedYamlBlocks,
} from "../utils/yaml-blocks.js";
import { report } from "../utils/report.js";

export const columnDescriptionRequired: Rule = {
  id: "column-description-required",
  severity: "warn",
  category: "Documentation",
  tags: ["enterprise", "strict"],
  recommendation: "Document every column in schema YAML",
  run: ({ yamlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of yamlFiles) {
      if (!isUnderModelsYaml(file)) continue;
      for (const model of splitNamedYamlBlocks(readFile(file), "models")) {
        for (const column of splitColumnBlocks(model.block)) {
          if (blockHasDescription(column.block)) continue;
          diagnostics.push(
            report(
              columnDescriptionRequired,
              file,
              `Column "${column.name}" on model "${model.name}" is missing a description`,
              "Add description under the column in the model YAML.",
            ),
          );
        }
      }
    }
    return diagnostics;
  },
};
