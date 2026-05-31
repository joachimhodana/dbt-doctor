import fs from "node:fs";
import path from "node:path";
import type { Rule } from "../types.js";
import { report } from "../utils/report.js";
import { splitColumnBlocks, splitSourceTableBlocks } from "../utils/yaml-blocks.js";

interface CatalogSource {
  source_name?: string;
  name?: string;
  columns?: Record<string, { name?: string }>;
}

interface CatalogDocument {
  sources?: Record<string, CatalogSource>;
}

const DEFAULT_CATALOG_PATH = "target/catalog.json";
const WARNED = new Set<string>();

const warnOnce = (message: string): void => {
  if (WARNED.has(message)) return;
  WARNED.add(message);
  console.warn(message);
};

const loadCatalogSources = (
  rootDirectory: string,
  catalogPath: string,
): Map<string, Set<string>> | null => {
  const absolute = path.join(rootDirectory, catalogPath);
  if (!fs.existsSync(absolute)) return null;

  try {
    const parsed = JSON.parse(fs.readFileSync(absolute, "utf8")) as CatalogDocument;
    const map = new Map<string, Set<string>>();

    for (const source of Object.values(parsed.sources ?? {})) {
      if (!source.source_name || !source.name) continue;
      const key = `${source.source_name}.${source.name}`.toLowerCase();
      const cols = new Set<string>();
      for (const column of Object.values(source.columns ?? {})) {
        if (!column?.name) continue;
        cols.add(column.name.toLowerCase());
      }
      map.set(key, cols);
    }

    return map;
  } catch {
    return null;
  }
};

export const sourceHasAllColumns: Rule = {
  id: "source-has-all-columns",
  severity: "warn",
  category: "Governance",
  tags: ["enterprise"],
  recommendation:
    "Keep source YAML columns aligned with the discovered catalog columns (target/catalog.json).",
  run: ({ rootDirectory, yamlFiles, readFile, ruleConfig }) => {
    const catalogPath =
      typeof ruleConfig.catalogPath === "string" && ruleConfig.catalogPath.trim().length > 0
        ? ruleConfig.catalogPath.trim()
        : DEFAULT_CATALOG_PATH;

    const catalogSources = loadCatalogSources(rootDirectory, catalogPath);
    if (!catalogSources) {
      warnOnce(
        `[dbt-doctor] Catalog not found at ${catalogPath}; skipping source-has-all-columns.`,
      );
      return [];
    }

    const diagnostics = [];

    for (const file of yamlFiles) {
      const content = readFile(file);
      if (!/^\s*sources:\s*$/m.test(content)) continue;

      for (const table of splitSourceTableBlocks(content)) {
        const key = `${table.sourceName}.${table.tableName}`.toLowerCase();
        const catalogColumns = catalogSources.get(key);
        if (!catalogColumns || catalogColumns.size === 0) continue;

        const yamlColumns = new Set(
          splitColumnBlocks(table.block).map((column) => column.name.toLowerCase()),
        );
        const missing = [...catalogColumns].filter((columnName) => !yamlColumns.has(columnName));
        if (missing.length === 0) continue;

        diagnostics.push(
          report(
            sourceHasAllColumns,
            file,
            `Source table "${table.sourceName}.${table.tableName}" is missing YAML columns from catalog: ${missing.join(", ")}`,
            `Add missing columns under tables[].columns (catalog: ${catalogPath}).`,
          ),
        );
      }
    }

    return diagnostics;
  },
};
