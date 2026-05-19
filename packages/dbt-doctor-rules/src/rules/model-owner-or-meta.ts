import type { Rule } from "../types.js";
import { isMartModelPath } from "../utils/path-layer.js";
import { isModelSqlPath, isUnderModelsYaml, modelBaseName } from "../utils/model-paths.js";
import { blockHasMetaOwner, findModelBlock } from "../utils/yaml-blocks.js";
import { report } from "../utils/report.js";

export const modelOwnerOrMeta: Rule = {
  id: "model-owner-or-meta",
  severity: "warn",
  category: "Governance",
  tags: ["enterprise"],
  recommendation: "Set meta.owner (or owner) on mart models for accountability",
  run: ({ sqlFiles, yamlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      if (!isModelSqlPath(file) || !isMartModelPath(file)) continue;
      const name = modelBaseName(file);
      const yamlBlock = findModelBlock(name, yamlFiles, readFile, isUnderModelsYaml);
      if (yamlBlock && blockHasMetaOwner(yamlBlock.block)) continue;
      diagnostics.push(
        report(
          modelOwnerOrMeta,
          file,
          `Mart model "${name}" has no meta.owner (or owner) in YAML`,
          "Add meta.owner (or owner) in the model YAML.",
        ),
      );
    }
    return diagnostics;
  },
};
