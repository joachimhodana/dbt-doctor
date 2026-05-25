import fs from "node:fs";
import path from "node:path";
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

interface CatalogNode {
  metadata?: { name?: string };
  name?: string;
  columns?: Record<string, { name?: string }>;
}

interface CatalogDocument {
  nodes?: Record<string, CatalogNode>;
  sources?: Record<string, CatalogNode>;
}

const DEFAULT_CATALOG_PATH = "target/catalog.json";
const WARNED = new Set<string>();

const warnOnce = (message: string): void => {
  if (WARNED.has(message)) return;
  WARNED.add(message);
  console.warn(message);
};

const loadCatalogColumns = (
  rootDirectory: string,
  catalogPath: string,
): {
  modelColumnsByName: Map<string, Set<string>>;
  sourceColumnsByName: Map<string, Set<string>>;
  seedColumnsByName: Map<string, Set<string>>;
} | null => {
  const absolute = path.join(rootDirectory, catalogPath);
  if (!fs.existsSync(absolute)) return null;

  try {
    const parsed = JSON.parse(fs.readFileSync(absolute, "utf8")) as CatalogDocument;
    const modelColumnsByName = new Map<string, Set<string>>();
    const sourceColumnsByName = new Map<string, Set<string>>();
    const seedColumnsByName = new Map<string, Set<string>>();

    for (const [uniqueId, node] of Object.entries(parsed.nodes ?? {})) {
      const columns = new Set<string>();
      for (const column of Object.values(node.columns ?? {})) {
        if (column?.name) columns.add(column.name.toLowerCase());
      }
      if (columns.size === 0) continue;
      const resourceName = (node.metadata?.name ?? node.name ?? uniqueId).toLowerCase();
      if (uniqueId.startsWith("model.")) modelColumnsByName.set(resourceName, columns);
      if (uniqueId.startsWith("seed.")) seedColumnsByName.set(resourceName, columns);
    }

    for (const [uniqueId, source] of Object.entries(parsed.sources ?? {})) {
      const columns = new Set<string>();
      for (const column of Object.values(source.columns ?? {})) {
        if (column?.name) columns.add(column.name.toLowerCase());
      }
      if (columns.size === 0) continue;
      const dotted = uniqueId.split(".");
      if (dotted.length >= 4) {
        sourceColumnsByName.set(`${dotted[dotted.length - 2]}.${dotted[dotted.length - 1]}`.toLowerCase(), columns);
      }
    }

    return { modelColumnsByName, sourceColumnsByName, seedColumnsByName };
  } catch {
    return null;
  }
};

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
    const catalogPath =
      typeof context.ruleConfig.catalogPath === "string" && context.ruleConfig.catalogPath.trim().length > 0
        ? context.ruleConfig.catalogPath.trim()
        : DEFAULT_CATALOG_PATH;
    const catalogColumns = loadCatalogColumns(context.rootDirectory, catalogPath);
    if (!catalogColumns) {
      warnOnce(`[dbt-doctor] Catalog not found at ${catalogPath}; required-docs-met will run file-based checks only.`);
    }

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

      const discoveredModelColumns = catalogColumns?.modelColumnsByName.get(modelName.toLowerCase());
      if (discoveredModelColumns && discoveredModelColumns.size > 0) {
        const yamlColumns = new Set(
          splitColumnBlocks(modelBlock.block).map((column) => column.name.toLowerCase()),
        );
        for (const catalogColumn of discoveredModelColumns) {
          if (yamlColumns.has(catalogColumn)) continue;
          diagnostics.push(
            report(
              requiredDocsMet,
              modelBlock.file,
              `Column "${catalogColumn}" in model "${modelName}" is missing from YAML docs required by +required_docs`,
              "Add the missing column block with description.",
            ),
          );
        }
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

      const discoveredSeedColumns = catalogColumns?.seedColumnsByName.get(seedName.toLowerCase());
      if (discoveredSeedColumns && discoveredSeedColumns.size > 0) {
        const yamlColumns = new Set(
          splitColumnBlocks(seedBlock.block).map((column) => column.name.toLowerCase()),
        );
        for (const catalogColumn of discoveredSeedColumns) {
          if (yamlColumns.has(catalogColumn)) continue;
          diagnostics.push(
            report(
              requiredDocsMet,
              seedBlock.file,
              `Column "${catalogColumn}" in seed "${seedName}" is missing from YAML docs required by +required_docs`,
              "Add the missing seed column block with description.",
            ),
          );
        }
      }
    }

    for (const file of context.yamlFiles) {
      if (!/\.(yml|yaml)$/i.test(file)) continue;
      const content = context.readFile(file);
      if (!/^\s*sources:\s*$/m.test(content)) continue;

      const requirements = resolveSourceRequirements(context, file);
      if (!requirements.requiredDocs) continue;

      for (const table of splitSourceTableBlocks(content)) {
        if (!blockHasDescription(table.block)) {
          diagnostics.push(
            report(
              requiredDocsMet,
              file,
              `Source table "${table.sourceName}.${table.tableName}" is missing description required by +required_docs`,
              "Add a non-empty description: field to the source table block.",
            ),
          );
        }

        const sourceKey = `${table.sourceName}.${table.tableName}`.toLowerCase();
        const discoveredSourceColumns = catalogColumns?.sourceColumnsByName.get(sourceKey);
        if (!discoveredSourceColumns || discoveredSourceColumns.size === 0) continue;
        const yamlColumns = new Set(
          splitColumnBlocks(table.block).map((column) => column.name.toLowerCase()),
        );
        for (const catalogColumn of discoveredSourceColumns) {
          if (yamlColumns.has(catalogColumn)) continue;
          diagnostics.push(
            report(
              requiredDocsMet,
              file,
              `Source column "${table.sourceName}.${table.tableName}.${catalogColumn}" is missing from YAML docs required by +required_docs`,
              "Add the missing source column with description.",
            ),
          );
        }
      }
    }

    return diagnostics;
  },
};
