import type { Rule } from "../types.js";
import { diagnosticPathForNode, isSourceNode } from "../utils/manifest-graph.js";
import { report } from "../utils/report.js";

export const undocumentedSources: Rule = {
  id: "undocumented-sources",
  severity: "warn",
  category: "Documentation",
  requiresManifest: true,
  recommendation: "Document every source table for lineage clarity and governance.",
  run: ({ manifest }) => {
    if (!manifest) return [];

    const diagnostics = [];

    for (const node of Object.values(manifest.nodes)) {
      if (!isSourceNode(node)) continue;
      if (node.description && node.description.trim().length > 0) continue;

      diagnostics.push(
        report(
          undocumentedSources,
          diagnosticPathForNode(node),
          `Source "${node.name}" has no description in manifest metadata`,
          "Add a description to the source table in YAML.",
        ),
      );
    }

    return diagnostics;
  },
};
