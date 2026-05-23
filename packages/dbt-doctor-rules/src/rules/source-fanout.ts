import type { Rule } from "../types.js";
import { SOURCE_FANOUT_MAX } from "../constants.js";
import {
  diagnosticPathForNode,
  isModelNode,
  isSourceNode,
} from "../utils/manifest-graph.js";
import { report } from "../utils/report.js";

export const sourceFanout: Rule = {
  id: "source-fanout",
  severity: "warn",
  category: "Architecture",
  requiresManifest: true,
  recommendation: "High source fanout often indicates repeated transformations across many models.",
  run: ({ manifest }) => {
    if (!manifest) return [];

    const diagnostics = [];
    for (const node of Object.values(manifest.nodes)) {
      if (!isSourceNode(node)) continue;

      const children = (manifest.childrenByNode[node.uniqueId] ?? []).filter((id) => {
        const child = manifest.nodes[id];
        return Boolean(child && isModelNode(child));
      });

      if (children.length <= SOURCE_FANOUT_MAX) continue;

      diagnostics.push(
        report(
          sourceFanout,
          diagnosticPathForNode(node),
          `Source "${node.name}" fans out to ${children.length} models`,
          "Consider adding shared staging/intermediate models to reduce repeated source usage.",
        ),
      );
    }

    return diagnostics;
  },
};
