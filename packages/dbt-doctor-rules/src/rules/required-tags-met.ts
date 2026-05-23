import type { Rule } from "../types.js";
import { isModelSqlPath, isUnderModelsYaml, modelBaseName } from "../utils/model-paths.js";
import {
  resolveModelRequirements,
  resolveSeedRequirements,
  resolveSourceRequirements,
} from "../utils/required-model-config.js";
import { report } from "../utils/report.js";
import {
  findModelBlock,
  findSeedBlock,
  splitSourceTableBlocks,
} from "../utils/yaml-blocks.js";

const seedNameFromPath = (seedPath: string): string =>
  seedPath.replace(/^.*\//, "").replace(/\.[^.]+$/, "");

const extractTags = (block: string): Set<string> => {
  const tags = new Set<string>();

  const inline = block.match(/\btags:\s*\[([^\]]+)\]/i)?.[1];
  if (inline) {
    for (const value of inline.split(",")) {
      const normalized = value.trim().replace(/^['"]|['"]$/g, "");
      if (normalized.length > 0) tags.add(normalized);
    }
  }

  const list = block.match(/\btags:\s*\n([\s\S]*?)(\n\s*[a-zA-Z_][\w-]*:|$)/i)?.[1] ?? "";
  for (const match of list.matchAll(/\n\s*-\s+([^\n]+)/g)) {
    const normalized = match[1].trim().replace(/^['"]|['"]$/g, "");
    if (normalized.length > 0) tags.add(normalized);
  }

  return tags;
};

const missingRequiredTags = (actualTags: Set<string>, requiredTags: string[]): string[] =>
  requiredTags.filter((required) => !actualTags.has(required));

export const requiredTagsMet: Rule = {
  id: "required-tags-met",
  severity: "warn",
  category: "Governance",
  recommendation:
    "Satisfy +required_tags from dbt_project.yml by declaring all required tags on models/seeds/sources.",
  run: (context) => {
    const diagnostics = [];

    for (const file of context.sqlFiles) {
      if (!isModelSqlPath(file)) continue;

      const requirements = resolveModelRequirements(context, file);
      if (requirements.requiredTags.length === 0) continue;

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
            requiredTagsMet,
            file,
            `Model "${modelName}" is missing YAML required for +required_tags checks`,
            "Add model YAML and tags to satisfy +required_tags requirements.",
          ),
        );
        continue;
      }

      const missingTags = missingRequiredTags(extractTags(modelBlock.block), requirements.requiredTags);
      if (missingTags.length === 0) continue;

      diagnostics.push(
        report(
          requiredTagsMet,
          modelBlock.file,
          `Model "${modelName}" is missing required tags: ${missingTags.join(", ")}`,
          `Add tags to satisfy +required_tags: ${requirements.requiredTags.join(", ")}.`,
        ),
      );
    }

    for (const file of context.seedDataFiles) {
      const requirements = resolveSeedRequirements(context, file);
      if (requirements.requiredTags.length === 0) continue;

      const seedName = seedNameFromPath(file);
      const seedBlock = findSeedBlock(seedName, context.yamlFiles, context.readFile);

      if (!seedBlock) {
        diagnostics.push(
          report(
            requiredTagsMet,
            file,
            `Seed "${seedName}" is missing YAML required for +required_tags checks`,
            "Add seed YAML and tags to satisfy +required_tags requirements.",
          ),
        );
        continue;
      }

      const missingTags = missingRequiredTags(extractTags(seedBlock.block), requirements.requiredTags);
      if (missingTags.length === 0) continue;

      diagnostics.push(
        report(
          requiredTagsMet,
          seedBlock.file,
          `Seed "${seedName}" is missing required tags: ${missingTags.join(", ")}`,
          `Add tags to satisfy +required_tags: ${requirements.requiredTags.join(", ")}.`,
        ),
      );
    }

    for (const file of context.yamlFiles) {
      if (!/\.(yml|yaml)$/i.test(file)) continue;
      const content = context.readFile(file);
      if (!/^\s*sources:\s*$/m.test(content)) continue;

      const requirements = resolveSourceRequirements(context, file);
      if (requirements.requiredTags.length === 0) continue;

      for (const table of splitSourceTableBlocks(content)) {
        const missingTags = missingRequiredTags(extractTags(table.block), requirements.requiredTags);
        if (missingTags.length === 0) continue;

        diagnostics.push(
          report(
            requiredTagsMet,
            file,
            `Source table "${table.sourceName}.${table.tableName}" is missing required tags: ${missingTags.join(", ")}`,
            `Add tags to satisfy +required_tags: ${requirements.requiredTags.join(", ")}.`,
          ),
        );
      }
    }

    return diagnostics;
  },
};
