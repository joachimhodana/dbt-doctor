import type { Rule } from "../types.js";
import { isModelSqlPath, isUnderModelsYaml, modelBaseName } from "../utils/model-paths.js";
import {
  resolveModelRequirements,
  resolveSeedRequirements,
  resolveSourceRequirements,
} from "../utils/required-model-config.js";
import { report } from "../utils/report.js";
import {
  blockHasDescription,
  findModelBlock,
  findSeedBlock,
  splitSourceTableBlocks,
  splitColumnBlocks,
} from "../utils/yaml-blocks.js";

const hasColumnDescription = (columnBlock: string): boolean =>
  /description:\s*\S/.test(columnBlock);
const seedNameFromPath = (seedPath: string): string =>
  seedPath.replace(/^.*\//, "").replace(/\.[^.]+$/, "");

export const requiredDocsMet: Rule = {
  id: "required-docs-met",
  severity: "warn",
  category: "Documentation",
  recommendation:
    "Satisfy +required_docs from dbt_project.yml by documenting model and column descriptions.",
  run: (context) => {
    const diagnostics = [];

    for (const file of context.sqlFiles) {
      if (!isModelSqlPath(file)) continue;

      const requirements = resolveModelRequirements(context, file);
      if (!requirements.requiredDocs) continue;

      const modelName = modelBaseName(file);
      const modelBlock = findModelBlock(
        modelName,
        context.yamlFiles,
        context.readFile,
        isUnderModelsYaml,
      );

      if (!modelBlock) {
        diagnostics.push(
          report(
            requiredDocsMet,
            file,
            `Model "${modelName}" is missing docs required by +required_docs`,
            "Add a models: entry in schema YAML with description and described columns.",
          ),
        );
        continue;
      }

      if (!blockHasDescription(modelBlock.block)) {
        diagnostics.push(
          report(
            requiredDocsMet,
            modelBlock.file,
            `Model "${modelName}" is missing description required by +required_docs`,
            "Add a non-empty description: field to the model block.",
          ),
        );
      }

      for (const column of splitColumnBlocks(modelBlock.block)) {
        if (hasColumnDescription(column.block)) continue;
        diagnostics.push(
          report(
            requiredDocsMet,
            modelBlock.file,
            `Column "${column.name}" in model "${modelName}" is missing description required by +required_docs`,
            "Add description: to each documented column.",
          ),
        );
      }
    }

    for (const file of context.seedDataFiles) {
      const requirements = resolveSeedRequirements(context, file);
      if (!requirements.requiredDocs) continue;

      const seedName = seedNameFromPath(file);
      const seedBlock = findSeedBlock(seedName, context.yamlFiles, context.readFile);

      if (!seedBlock) {
        diagnostics.push(
          report(
            requiredDocsMet,
            file,
            `Seed "${seedName}" is missing docs required by +required_docs`,
            "Add a seeds: entry in YAML with a non-empty description.",
          ),
        );
        continue;
      }

      if (!blockHasDescription(seedBlock.block)) {
        diagnostics.push(
          report(
            requiredDocsMet,
            seedBlock.file,
            `Seed "${seedName}" is missing description required by +required_docs`,
            "Add a non-empty description: field to the seed block.",
          ),
        );
      }
    }

    for (const file of context.yamlFiles) {
      if (!/\.(yml|yaml)$/i.test(file)) continue;
      const content = context.readFile(file);
      if (!/^\s*sources:\s*$/m.test(content)) continue;

      const requirements = resolveSourceRequirements(context, file);
      if (!requirements.requiredDocs) continue;

      for (const table of splitSourceTableBlocks(content)) {
        if (blockHasDescription(table.block)) continue;
        diagnostics.push(
          report(
            requiredDocsMet,
            file,
            `Source table "${table.sourceName}.${table.tableName}" is missing description required by +required_docs`,
            "Add a non-empty description: field to the source table block.",
          ),
        );
      }
    }

    return diagnostics;
  },
};
