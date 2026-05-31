import type { Rule } from "../types.js";
import {
  diagnosticPathForNode,
  isModelNode,
  isSeedNode,
  isSourceNode,
  parentNodes,
} from "../utils/manifest-graph.js";
import { report } from "../utils/report.js";

export const rootModels: Rule = {
  id: "root-models",
  severity: "warn",
  category: "Structure",
  requiresManifest: true,
  recommendation: "Root models with no sources or model parents are usually accidental DAG roots.",
  run: ({ manifest, project }) => {
    if (!manifest) return [];

    const diagnostics = [];
    const projectName = project.projectName.toLowerCase();

    for (const node of Object.values(manifest.nodes)) {
      if (!isModelNode(node)) continue;
      if (node.packageName && node.packageName.toLowerCase() !== projectName) continue;

      const parents = parentNodes(manifest, node);
      const hasUpstreamParent = parents.some(
        (parent) => isModelNode(parent) || isSourceNode(parent) || isSeedNode(parent),
      );
      if (hasUpstreamParent) continue;

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
