import type { ManifestGraph, ManifestNode } from "@dbt-doctor/manifest";

export const isModelNode = (node: ManifestNode): boolean => node.resourceType === "model";
export const isSourceNode = (node: ManifestNode): boolean => node.resourceType === "source";
export const isSeedNode = (node: ManifestNode): boolean => node.resourceType === "seed";
export const isExposureNode = (node: ManifestNode): boolean => node.resourceType === "exposure";

const nodePath = (node: ManifestNode): string =>
  (node.originalFilePath ?? node.path ?? "").replace(/\\/g, "/");

export const isStagingModelNode = (node: ManifestNode): boolean => {
  if (!isModelNode(node)) return false;
  if (node.name.startsWith("stg_")) return true;
  return /(^|\/)models\/staging\//.test(nodePath(node));
};

export const isIntermediateModelNode = (node: ManifestNode): boolean => {
  if (!isModelNode(node)) return false;
  if (node.name.startsWith("int_")) return true;
  return /(^|\/)models\/intermediate\//.test(nodePath(node));
};

export const isMartModelNode = (node: ManifestNode): boolean => {
  if (!isModelNode(node)) return false;
  if (node.name.startsWith("fct_") || node.name.startsWith("dim_")) return true;
  return /(^|\/)models\/marts\//.test(nodePath(node));
};

export const diagnosticPathForNode = (node: ManifestNode): string =>
  node.originalFilePath ?? node.path ?? `manifest:${node.uniqueId}`;

export const parseSourceParts = (
  sourceUniqueId: string,
): { packageName: string; sourceName: string; tableName: string } | null => {
  const parts = sourceUniqueId.split(".");
  if (parts.length < 4) return null;
  if (parts[0] !== "source") return null;
  return {
    packageName: parts[1],
    sourceName: parts[2],
    tableName: parts.slice(3).join("."),
  };
};

export const parentNodes = (manifest: ManifestGraph, node: ManifestNode): ManifestNode[] =>
  node.dependsOn.map((dependencyId) => manifest.nodes[dependencyId]).filter(Boolean);

export const sourceAncestors = (manifest: ManifestGraph, nodeId: string): Set<string> => {
  const visited = new Set<string>();
  const sources = new Set<string>();
  const stack = [nodeId];

  while (stack.length > 0) {
    const currentId = stack.pop();
    if (!currentId || visited.has(currentId)) continue;
    visited.add(currentId);

    const current = manifest.nodes[currentId];
    if (!current) continue;

    for (const parentId of current.dependsOn) {
      const parent = manifest.nodes[parentId];
      if (!parent) continue;
      if (isSourceNode(parent)) {
        sources.add(parent.uniqueId);
      } else {
        stack.push(parentId);
      }
    }
  }

  return sources;
};

export const maxViewChainDepth = (manifest: ManifestGraph, nodeId: string): number => {
  const memo = new Map<string, number>();

  const visit = (currentId: string): number => {
    if (memo.has(currentId)) return memo.get(currentId)!;

    const current = manifest.nodes[currentId];
    if (!current || !isModelNode(current) || current.materialized !== "view") {
      memo.set(currentId, 0);
      return 0;
    }

    let bestParentDepth = 0;
    for (const parentId of current.dependsOn) {
      bestParentDepth = Math.max(bestParentDepth, visit(parentId));
    }

    const depth = 1 + bestParentDepth;
    memo.set(currentId, depth);
    return depth;
  };

  return visit(nodeId);
};
