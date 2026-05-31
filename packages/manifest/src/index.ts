import fs from "node:fs";
import path from "node:path";
import { warnOnce } from "./warn-once.js";
import type { ManifestEdge, ManifestGraph, ManifestNode } from "./types.js";

interface RawManifestNode {
  unique_id?: string;
  name?: string;
  resource_type?: string;
  original_file_path?: string;
  path?: string;
  package_name?: string;
  access?: string;
  description?: string;
  config?: {
    materialized?: string;
  };
  depends_on?: {
    nodes?: string[];
  };
}

interface RawManifest {
  nodes?: Record<string, RawManifestNode>;
  sources?: Record<string, RawManifestNode>;
  exposures?: Record<string, RawManifestNode>;
  parent_map?: Record<string, string[]>;
}

const DEFAULT_MANIFEST_PATH = "target/manifest.json";

const toManifestNode = (raw: RawManifestNode, fallbackId: string): ManifestNode => ({
  uniqueId: raw.unique_id ?? fallbackId,
  name: raw.name ?? fallbackId,
  resourceType: raw.resource_type ?? "unknown",
  originalFilePath: raw.original_file_path ?? null,
  path: raw.path ?? null,
  packageName: raw.package_name ?? null,
  materialized: raw.config?.materialized ?? null,
  access: raw.access ?? null,
  description: raw.description ?? null,
  dependsOn: raw.depends_on?.nodes ?? [],
});

const normalizePath = (value: string): string => value.replace(/\\/g, "/");

const buildGraph = (raw: RawManifest): ManifestGraph => {
  const nodes: Record<string, ManifestNode> = {};
  const edges: ManifestEdge[] = [];
  const childrenByNode: Record<string, string[]> = {};

  for (const [uniqueId, rawNode] of Object.entries(raw.nodes ?? {})) {
    nodes[uniqueId] = toManifestNode(rawNode, uniqueId);
  }

  for (const [uniqueId, rawSource] of Object.entries(raw.sources ?? {})) {
    nodes[uniqueId] = toManifestNode(rawSource, uniqueId);
  }

  for (const [uniqueId, rawExposure] of Object.entries(raw.exposures ?? {})) {
    nodes[uniqueId] = toManifestNode(rawExposure, uniqueId);
  }

  // dbt manifest variants can provide dependencies in parent_map. Backfill
  // dependsOn when the node-level field is absent to stay engine-compatible.
  for (const [uniqueId, parents] of Object.entries(raw.parent_map ?? {})) {
    const node = nodes[uniqueId];
    if (!node) {
      continue;
    }
    if (node.dependsOn.length > 0) {
      continue;
    }
    node.dependsOn = [...parents];
  }

  for (const node of Object.values(nodes)) {
    for (const dependency of node.dependsOn) {
      edges.push({ from: node.uniqueId, to: dependency });
      if (!childrenByNode[dependency]) {
        childrenByNode[dependency] = [];
      }
      childrenByNode[dependency].push(node.uniqueId);
    }
  }

  return { nodes, edges, childrenByNode };
};

export const readManifest = (
  rootDirectory: string,
  manifestPath?: string,
): ManifestGraph | null => {
  const relativeManifestPath = manifestPath ?? DEFAULT_MANIFEST_PATH;
  const absoluteManifestPath = path.join(rootDirectory, relativeManifestPath);

  if (!fs.existsSync(absoluteManifestPath)) {
    warnOnce(
      `[dbt-doctor] Manifest not found at ${normalizePath(relativeManifestPath)}; skipping manifest rules.`,
    );
    return null;
  }

  try {
    const rawManifest = JSON.parse(fs.readFileSync(absoluteManifestPath, "utf8")) as RawManifest;
    return buildGraph(rawManifest);
  } catch {
    warnOnce(
      `[dbt-doctor] Failed to parse ${normalizePath(relativeManifestPath)}; skipping manifest rules.`,
    );
    return null;
  }
};

export type { ManifestEdge, ManifestGraph, ManifestNode } from "./types.js";
export { warnOnce } from "./warn-once.js";
