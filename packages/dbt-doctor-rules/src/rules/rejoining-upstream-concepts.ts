import type { Rule } from "../types.js";
import { diagnosticPathForNode, isModelNode, sourceAncestors } from "../utils/manifest-graph.js";
import { report } from "../utils/report.js";

const intersects = (left: Set<string>, right: Set<string>): boolean => {
  for (const item of left) {
    if (right.has(item)) return true;
  }
  return false;
};

export const rejoiningUpstreamConcepts: Rule = {
  id: "rejoining-upstream-concepts",
  severity: "error",
  category: "Architecture",
  requiresManifest: true,
  recommendation: "Avoid rejoining upstream concepts already combined earlier in the DAG.",
  run: ({ manifest }) => {
    if (!manifest) return [];

    const diagnostics = [];

    for (const node of Object.values(manifest.nodes)) {
      if (!isModelNode(node)) continue;

      const modelParents = node.dependsOn
        .map((id) => manifest.nodes[id])
        .filter((parent): parent is NonNullable<typeof parent> => Boolean(parent && isModelNode(parent)));

      if (modelParents.length < 2) continue;

      let hasOverlap = false;
      for (let index = 0; index < modelParents.length; index += 1) {
        const leftAncestors = sourceAncestors(manifest, modelParents[index]!.uniqueId);
        for (let right = index + 1; right < modelParents.length; right += 1) {
          const rightAncestors = sourceAncestors(manifest, modelParents[right]!.uniqueId);
          if (!intersects(leftAncestors, rightAncestors)) continue;
          hasOverlap = true;
          break;
        }
        if (hasOverlap) break;
      }

      if (!hasOverlap) continue;

      diagnostics.push(
        report(
          rejoiningUpstreamConcepts,
          diagnosticPathForNode(node),
          `Model "${node.name}" may rejoin overlapping upstream concepts`,
          "Check whether shared logic should be centralized in an intermediate model.",
        ),
      );
    }

    return diagnostics;
  },
};
