import type { Rule } from "../types.js";
import { CHAINED_VIEWS_DEPTH } from "../constants.js";
import { diagnosticPathForNode, isModelNode, maxViewChainDepth } from "../utils/manifest-graph.js";
import { report } from "../utils/report.js";

export const chainedViews: Rule = {
  id: "chained-views",
  severity: "warn",
  category: "Performance",
  requiresManifest: true,
  recommendation: "Long chains of views can increase query latency and failure blast radius.",
  run: ({ manifest }) => {
    if (!manifest) return [];

    const diagnostics = [];

    for (const node of Object.values(manifest.nodes)) {
      if (!isModelNode(node)) continue;
      if (node.materialized !== "view") continue;

      const depth = maxViewChainDepth(manifest, node.uniqueId);
      if (depth <= CHAINED_VIEWS_DEPTH) continue;

      diagnostics.push(
        report(
          chainedViews,
          diagnosticPathForNode(node),
          `Model "${node.name}" is in a view chain of depth ${depth}`,
          "Materialize upstream steps as table/incremental to shorten chained views.",
        ),
      );
    }

    return diagnostics;
  },
};
