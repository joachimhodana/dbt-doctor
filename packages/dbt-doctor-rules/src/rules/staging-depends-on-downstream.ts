import type { Rule } from "../types.js";
import {
  diagnosticPathForNode,
  isIntermediateModelNode,
  isMartModelNode,
  isStagingModelNode,
  parentNodes,
} from "../utils/manifest-graph.js";
import { report } from "../utils/report.js";

export const stagingDependsOnDownstream: Rule = {
  id: "staging-depends-on-downstream",
  severity: "error",
  category: "Architecture",
  requiresManifest: true,
  recommendation: "Staging models should depend on sources, not intermediate or marts models.",
  run: ({ manifest }) => {
    if (!manifest) return [];

    const diagnostics = [];

    for (const node of Object.values(manifest.nodes)) {
      if (!isStagingModelNode(node)) continue;

      for (const parent of parentNodes(manifest, node)) {
        if (!isIntermediateModelNode(parent) && !isMartModelNode(parent)) continue;

        diagnostics.push(
          report(
            stagingDependsOnDownstream,
            diagnosticPathForNode(node),
            `Staging model "${node.name}" depends on downstream model "${parent.name}"`,
            "Move shared logic upstream or shift this model to intermediate/marts.",
          ),
        );
      }
    }

    return diagnostics;
  },
};
