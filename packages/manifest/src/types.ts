export interface ManifestNode {
  uniqueId: string;
  name: string;
  resourceType: string;
  originalFilePath: string | null;
  path: string | null;
  packageName: string | null;
  materialized: string | null;
  access: string | null;
  description: string | null;
  dependsOn: string[];
}

export interface ManifestEdge {
  from: string;
  to: string;
}

export interface ManifestGraph {
  nodes: Record<string, ManifestNode>;
  edges: ManifestEdge[];
  childrenByNode: Record<string, string[]>;
}
