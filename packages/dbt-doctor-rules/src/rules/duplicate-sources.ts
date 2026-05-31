import type { Rule } from "../types.js";
import { diagnosticPathForNode, isSourceNode, parseSourceParts } from "../utils/manifest-graph.js";
import { report } from "../utils/report.js";

export const duplicateSources: Rule = {
  id: "duplicate-sources",
  severity: "warn",
  category: "Sources",
  requiresManifest: true,
  recommendation: "Duplicate source definitions can fragment lineage and governance.",
  run: ({ manifest }) => {
    if (!manifest) return [];

    const diagnostics = [];
    const byLogicalSource = new Map<string, string[]>();

    for (const node of Object.values(manifest.nodes)) {
      if (!isSourceNode(node)) continue;
      const parsed = parseSourceParts(node.uniqueId);
      if (!parsed) continue;

      const key = `${parsed.sourceName}.${parsed.tableName}`;
      byLogicalSource.set(key, [...(byLogicalSource.get(key) ?? []), node.uniqueId]);
    }

    for (const [logicalKey, ids] of byLogicalSource.entries()) {
      if (ids.length < 2) continue;

      for (const id of ids) {
        const sourceNode = manifest.nodes[id];
        if (!sourceNode) continue;
        diagnostics.push(
          report(
            duplicateSources,
            diagnosticPathForNode(sourceNode),
            `Source "${logicalKey}" appears multiple times in manifest definitions`,
            "Consolidate duplicate source declarations into one canonical definition.",
          ),
        );
      }
    }

    return diagnostics;
  },
};
