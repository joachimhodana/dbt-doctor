import type { Rule } from "../types.js";
import { isModelSqlPath, isUnderModelsYaml, modelBaseName } from "../utils/model-paths.js";
import { report } from "../utils/report.js";
import { findModelBlock, splitColumnBlocks } from "../utils/yaml-blocks.js";

const columnHasPkConstraint = (columnBlock: string): boolean =>
  /\bconstraints:\s*\n[\s\S]*?\btype:\s*primary_key\b/i.test(columnBlock) ||
  /\bconstraints:\s*\[[^\]]*primary_key[^\]]*\]/i.test(columnBlock) ||
  /\bprimary_key:\s*true\b/i.test(columnBlock);

export const modelSinglePkColumnLevel: Rule = {
  id: "model-single-pk-column-level",
  severity: "warn",
  category: "Governance",
  recommendation: "Define exactly one primary key at column level when PK is required.",
  run: ({ sqlFiles, yamlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      if (!isModelSqlPath(file)) continue;
      const modelName = modelBaseName(file);
      const modelBlock = findModelBlock(modelName, yamlFiles, readFile, isUnderModelsYaml);
      if (!modelBlock) continue;
      const pkColumns = splitColumnBlocks(modelBlock.block).filter((column) =>
        columnHasPkConstraint(column.block),
      );
      if (pkColumns.length === 1) continue;
      diagnostics.push(
        report(
          modelSinglePkColumnLevel,
          modelBlock.file,
          `Model "${modelName}" should define exactly one column-level primary key, found ${pkColumns.length}`,
          "Set one primary_key constraint at column level.",
        ),
      );
    }
    return diagnostics;
  },
};
