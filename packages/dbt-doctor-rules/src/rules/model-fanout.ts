import type { Rule } from "../types.js";
import { MODEL_FANOUT_MAX } from "../constants.js";
import { diagnosticPathForNode, isModelNode } from "../utils/manifest-graph.js";
import { report } from "../utils/report.js";

export const modelFanout: Rule = {
  id: "model-fanout",
  severity: "warn",
  category: "Architecture",
  requiresManifest: true,
  recommendation: "Very high model fanout can create brittle DAG bottlenecks.",
  run: ({ manifest }) => {
    if (!manifest) return [];

    const diagnostics = [];

    for (const node of Object.values(manifest.nodes)) {
      if (!isModelNode(node)) continue;

      const children = (manifest.childrenByNode[node.uniqueId] ?? []).filter((id) => {
        const child = manifest.nodes[id];
        return Boolean(child && isModelNode(child));
      });

      if (children.length <= MODEL_FANOUT_MAX) continue;

      diagnostics.push(
        report(
          modelFanout,
          diagnosticPathForNode(node),
          `Model "${node.name}" fans out to ${children.length} downstream models`,
          "Split responsibilities or add stable interfaces to reduce dependency blast radius.",
        ),
      );
    }

    return diagnostics;
  },
};
