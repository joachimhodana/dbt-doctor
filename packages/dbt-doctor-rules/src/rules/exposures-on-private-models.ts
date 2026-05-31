import type { Rule } from "../types.js";
import {
  diagnosticPathForNode,
  isExposureNode,
  isModelNode,
  parentNodes,
} from "../utils/manifest-graph.js";
import { report } from "../utils/report.js";

export const exposuresOnPrivateModels: Rule = {
  id: "exposures-on-private-models",
  severity: "error",
  category: "Governance",
  requiresManifest: true,
  recommendation: "Public exposures should not directly depend on private models.",
  run: ({ manifest }) => {
    if (!manifest) return [];

    const diagnostics = [];

    for (const node of Object.values(manifest.nodes)) {
      if (!isExposureNode(node)) continue;

      for (const parent of parentNodes(manifest, node)) {
        if (!isModelNode(parent)) continue;
        if (parent.access !== "private") continue;

        diagnostics.push(
          report(
            exposuresOnPrivateModels,
            diagnosticPathForNode(node),
            `Exposure "${node.name}" depends on private model "${parent.name}"`,
            "Expose a public interface model for downstream exposure dependencies.",
          ),
        );
      }
    }

    return diagnostics;
  },
};
