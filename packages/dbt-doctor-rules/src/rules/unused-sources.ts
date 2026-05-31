import type { ManifestNode } from "@dbt-doctor/manifest";
import type { Rule } from "../types.js";
import { report } from "../utils/report.js";

const isSourceNode = (node: ManifestNode): boolean => node.resourceType === "source";

const toDiagnosticPath = (node: ManifestNode): string =>
  node.originalFilePath ?? node.path ?? `manifest:${node.uniqueId}`;

export const unusedSources: Rule = {
  id: "unused-sources",
  severity: "warn",
  category: "Sources",
  requiresManifest: true,
  recommendation: "Remove unused sources or connect them to downstream models.",
  run: ({ manifest }) => {
    if (!manifest) {
      return [];
    }

    const diagnostics = [];

    for (const node of Object.values(manifest.nodes)) {
      if (!isSourceNode(node)) {
        continue;
      }

      const children = manifest.childrenByNode[node.uniqueId] ?? [];
      if (children.length > 0) {
        continue;
      }

      diagnostics.push(
        report(
          unusedSources,
          toDiagnosticPath(node),
          `Source "${node.name}" is defined but never referenced by any model`,
          "Delete dead sources or add source() references so lineage stays accurate.",
        ),
      );
    }

    return diagnostics;
  },
};
