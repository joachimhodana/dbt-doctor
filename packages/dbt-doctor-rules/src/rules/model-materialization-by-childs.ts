import type { Rule } from "../types.js";
import { report } from "../utils/report.js";
import { isModelNode, diagnosticPathForNode } from "../utils/manifest-graph.js";

export const modelMaterializationByChilds: Rule = {
  id: "model-materialization-by-childs",
  severity: "warn",
  category: "Performance",
  requiresManifest: true,
  recommendation: "Heavily reused parent models should use durable materializations.",
  run: (context) => {
    if (!context.manifest) return [];
    const minChildren =
      typeof context.ruleConfig.minChildren === "number"
        ? Math.max(1, Math.floor(context.ruleConfig.minChildren))
        : 3;
    const requiredMaterialized =
      typeof context.ruleConfig.materialized === "string" ? context.ruleConfig.materialized : null;
    if (!requiredMaterialized) return [];

    const diagnostics = [];

    for (const node of Object.values(context.manifest.nodes)) {
      if (!isModelNode(node)) continue;
      const children = (context.manifest.childrenByNode[node.uniqueId] ?? []).filter((id) => {
        const child = context.manifest?.nodes[id];
        return Boolean(child && isModelNode(child));
      });
      if (children.length < minChildren) continue;
      if (node.materialized === requiredMaterialized) continue;

      diagnostics.push(
        report(
          modelMaterializationByChilds,
          diagnosticPathForNode(node),
          `Model "${node.name}" has ${children.length} downstream models but materialized="${node.materialized ?? "unknown"}"`,
          `Set materialized="${requiredMaterialized}" (or adjust threshold).`,
        ),
      );
    }

    return diagnostics;
  },
};
