import type { Rule } from "../types.js";
import { diagnosticPathForNode, isModelNode, parentNodes } from "../utils/manifest-graph.js";
import { report } from "../utils/report.js";

const parseLimit = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, Math.floor(value));
  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    return Number.parseInt(value.trim(), 10);
  }
  return null;
};

export const modelParentsAndChilds: Rule = {
  id: "model-parents-and-childs",
  severity: "warn",
  category: "Architecture",
  tags: ["enterprise"],
  requiresManifest: true,
  recommendation:
    "Set min/max parent and child thresholds to enforce model graph shape (dbt-checkpoint parity).",
  run: ({ manifest, ruleConfig }) => {
    if (!manifest) return [];

    const minParents = parseLimit(ruleConfig.minParents);
    const maxParents = parseLimit(ruleConfig.maxParents);
    const minChildren = parseLimit(ruleConfig.minChildren);
    const maxChildren = parseLimit(ruleConfig.maxChildren);
    if (
      minParents === null &&
      maxParents === null &&
      minChildren === null &&
      maxChildren === null
    ) {
      return [];
    }

    const diagnostics = [];

    for (const node of Object.values(manifest.nodes)) {
      if (!isModelNode(node)) continue;

      const parentCount = parentNodes(manifest, node).filter(isModelNode).length;
      const childCount = (manifest.childrenByNode[node.uniqueId] ?? []).filter((id) => {
        const child = manifest.nodes[id];
        return Boolean(child && isModelNode(child));
      }).length;

      if (minParents !== null && parentCount < minParents) {
        diagnostics.push(
          report(
            modelParentsAndChilds,
            diagnosticPathForNode(node),
            `Model "${node.name}" has ${parentCount} model parents (< ${minParents})`,
            "Adjust model dependencies or lower rules.model-parents-and-childs.minParents.",
          ),
        );
      }

      if (maxParents !== null && parentCount > maxParents) {
        diagnostics.push(
          report(
            modelParentsAndChilds,
            diagnosticPathForNode(node),
            `Model "${node.name}" has ${parentCount} model parents (> ${maxParents})`,
            "Reduce upstream coupling or raise rules.model-parents-and-childs.maxParents.",
          ),
        );
      }

      if (minChildren !== null && childCount < minChildren) {
        diagnostics.push(
          report(
            modelParentsAndChilds,
            diagnosticPathForNode(node),
            `Model "${node.name}" has ${childCount} model children (< ${minChildren})`,
            "Adjust downstream usage or lower rules.model-parents-and-childs.minChildren.",
          ),
        );
      }

      if (maxChildren !== null && childCount > maxChildren) {
        diagnostics.push(
          report(
            modelParentsAndChilds,
            diagnosticPathForNode(node),
            `Model "${node.name}" has ${childCount} model children (> ${maxChildren})`,
            "Split fanout or raise rules.model-parents-and-childs.maxChildren.",
          ),
        );
      }
    }

    return diagnostics;
  },
};
