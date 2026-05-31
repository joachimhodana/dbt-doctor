import type { ManifestNode } from "@dbt-doctor/manifest";
import type { Rule } from "../types.js";
import { report } from "../utils/report.js";

const REF_PATTERN = /\{\{-?\s*ref\s*\(\s*["']([^"']+)["']\s*\)\s*\}\}/g;
const SOURCE_PATTERN =
  /\{\{-?\s*source\s*\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*\)\s*\}\}/g;

const isModelNode = (node: ManifestNode): boolean => node.resourceType === "model";
const isSourceNode = (node: ManifestNode): boolean => node.resourceType === "source";
const isSeedNode = (node: ManifestNode): boolean => node.resourceType === "seed";

export const sqlReferenceTargetExists: Rule = {
  id: "sql-reference-target-exists",
  severity: "warn",
  category: "SQL Quality",
  tags: ["style", "sql-style"],
  requiresManifest: true,
  recommendation: "Ensure every ref() and source() target exists in manifest metadata.",
  run: ({ sqlFiles, readFile, manifest }) => {
    if (!manifest) return [];

    const refTargets = new Set(
      Object.values(manifest.nodes)
        .filter((node) => isModelNode(node) || isSeedNode(node))
        .map((node) => node.name.toLowerCase()),
    );

    const sourcePairs = new Set(
      Object.values(manifest.nodes)
        .filter(isSourceNode)
        .map((node) => {
          const parts = node.uniqueId.split(".");
          if (parts.length < 4) return "";
          return `${parts[2]}.${parts.slice(3).join(".")}`.toLowerCase();
        })
        .filter(Boolean),
    );

    const diagnostics = [];

    for (const file of sqlFiles) {
      const content = readFile(file);

      for (const match of content.matchAll(REF_PATTERN)) {
        const model = match[1]?.trim();
        if (!model) continue;
        if (refTargets.has(model.toLowerCase())) continue;

        diagnostics.push(
          report(
            sqlReferenceTargetExists,
            file,
            `ref("${model}") target does not exist in manifest`,
            "Create the model or update the ref() target name.",
          ),
        );
      }

      for (const match of content.matchAll(SOURCE_PATTERN)) {
        const sourceName = match[1]?.trim();
        const tableName = match[2]?.trim();
        if (!sourceName || !tableName) continue;

        const key = `${sourceName}.${tableName}`.toLowerCase();
        if (sourcePairs.has(key)) continue;

        diagnostics.push(
          report(
            sqlReferenceTargetExists,
            file,
            `source("${sourceName}", "${tableName}") target does not exist in manifest`,
            "Create the source/table definition or update the source() target.",
          ),
        );
      }
    }

    return diagnostics;
  },
};
