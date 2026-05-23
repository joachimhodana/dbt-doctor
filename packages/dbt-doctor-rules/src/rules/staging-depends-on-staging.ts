import type { ManifestNode } from "@dbt-doctor/manifest";
import type { Rule } from "../types.js";
import { report } from "../utils/report.js";

const isStagingNode = (node: ManifestNode): boolean => {
  if (node.resourceType !== "model") {
    return false;
  }

  if (node.name.startsWith("stg_")) {
    return true;
  }

  const filePath = node.originalFilePath ?? node.path ?? "";
  return /(^|\/)models\/staging\//.test(filePath);
};

const toDiagnosticPath = (node: ManifestNode): string =>
  node.originalFilePath ?? node.path ?? `manifest:${node.uniqueId}`;

export const stagingDependsOnStaging: Rule = {
  id: "staging-depends-on-staging",
  severity: "error",
  category: "Architecture",
  requiresManifest: true,
  recommendation:
    "Staging models should depend on sources only. Move transformations to intermediate or marts.",
  run: ({ manifest }) => {
    if (!manifest) {
      return [];
    }

    const diagnostics = [];

    for (const node of Object.values(manifest.nodes)) {
      if (!isStagingNode(node)) {
        continue;
      }

      for (const parentId of node.dependsOn) {
        const parent = manifest.nodes[parentId];
        if (!parent || !isStagingNode(parent)) {
          continue;
        }

        diagnostics.push(
          report(
            stagingDependsOnStaging,
            toDiagnosticPath(node),
            `Staging model "${node.name}" depends on staging model "${parent.name}"`,
            "Staging should read directly from source() and avoid chaining staging-on-staging dependencies.",
          ),
        );
      }
    }

    return diagnostics;
  },
};
