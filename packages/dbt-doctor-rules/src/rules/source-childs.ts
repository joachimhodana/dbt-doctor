import type { Rule } from "../types.js";
import { report } from "../utils/report.js";
import { isSourceNode, diagnosticPathForNode, isModelNode } from "../utils/manifest-graph.js";

export const sourceChilds: Rule = {
  id: "source-childs",
  severity: "warn",
  category: "Architecture",
  requiresManifest: true,
  recommendation: "Sources should have at least a minimum number of downstream models.",
  run: (context) => {
    if (!context.manifest) return [];
    const minChildren =
      typeof context.ruleConfig.minChildren === "number"
        ? Math.max(1, Math.floor(context.ruleConfig.minChildren))
        : 1;

    const diagnostics = [];
    for (const node of Object.values(context.manifest.nodes)) {
      if (!isSourceNode(node)) continue;
      const children = (context.manifest.childrenByNode[node.uniqueId] ?? []).filter((id) => {
        const child = context.manifest?.nodes[id];
        return Boolean(child && isModelNode(child));
      });
      if (children.length >= minChildren) continue;

      diagnostics.push(
        report(
          sourceChilds,
          diagnosticPathForNode(node),
          `Source "${node.name}" has ${children.length} downstream model(s), minimum is ${minChildren}`,
          "Verify source usage or lower the minimum children threshold.",
        ),
      );
    }

    return diagnostics;
  },
};
