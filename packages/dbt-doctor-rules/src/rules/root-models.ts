import type { Rule } from "../types.js";
import { diagnosticPathForNode, isModelNode, isSourceNode, parentNodes } from "../utils/manifest-graph.js";
import { report } from "../utils/report.js";

export const rootModels: Rule = {
  id: "root-models",
  severity: "warn",
  category: "Structure",
  requiresManifest: true,
  recommendation: "Root models with no sources or model parents are usually accidental DAG roots.",
  run: ({ manifest }) => {
    if (!manifest) return [];

    const diagnostics = [];

    for (const node of Object.values(manifest.nodes)) {
      if (!isModelNode(node)) continue;

      const parents = parentNodes(manifest, node);
      const hasModelOrSourceParent = parents.some((parent) => isModelNode(parent) || isSourceNode(parent));
      if (hasModelOrSourceParent) continue;

      diagnostics.push(
        report(
          rootModels,
          diagnosticPathForNode(node),
          `Model "${node.name}" has no model/source parents (root model)`,
          "Verify this is intentional; otherwise connect it to source() or ref() dependencies.",
        ),
      );
    }

    return diagnostics;
  },
};
