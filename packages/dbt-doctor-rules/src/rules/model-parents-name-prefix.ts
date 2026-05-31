import type { Rule } from "../types.js";
import { report } from "../utils/report.js";
import { isModelNode, parentNodes, diagnosticPathForNode } from "../utils/manifest-graph.js";

export const modelParentsNamePrefix: Rule = {
  id: "model-parents-name-prefix",
  severity: "warn",
  category: "Architecture",
  requiresManifest: true,
  recommendation: "Parent model names should match an expected prefix.",
  run: (context) => {
    if (!context.manifest) return [];
    const prefix = typeof context.ruleConfig.prefix === "string" ? context.ruleConfig.prefix : null;
    if (!prefix) return [];

    const diagnostics = [];
    for (const node of Object.values(context.manifest.nodes)) {
      if (!isModelNode(node)) continue;
      for (const parent of parentNodes(context.manifest, node)) {
        if (!isModelNode(parent)) continue;
        if (parent.name.startsWith(prefix)) continue;
        diagnostics.push(
          report(
            modelParentsNamePrefix,
            diagnosticPathForNode(node),
            `Model "${node.name}" has parent "${parent.name}" missing prefix "${prefix}"`,
            `Rename parent models or change prefix requirement.`,
          ),
        );
      }
    }
    return diagnostics;
  },
};
