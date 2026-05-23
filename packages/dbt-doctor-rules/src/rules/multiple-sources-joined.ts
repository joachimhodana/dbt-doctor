import type { Rule } from "../types.js";
import { diagnosticPathForNode, isModelNode, isSourceNode } from "../utils/manifest-graph.js";
import { report } from "../utils/report.js";

export const multipleSourcesJoined: Rule = {
  id: "multiple-sources-joined",
  severity: "error",
  category: "Architecture",
  requiresManifest: true,
  recommendation: "Joining multiple raw sources directly often belongs in intermediate models.",
  run: ({ manifest, readFile }) => {
    if (!manifest) return [];

    const diagnostics = [];

    for (const node of Object.values(manifest.nodes)) {
      if (!isModelNode(node)) continue;

      const sourceParents = node.dependsOn
        .map((id) => manifest.nodes[id])
        .filter((parent): parent is NonNullable<typeof parent> => Boolean(parent && isSourceNode(parent)));

      if (sourceParents.length < 2) continue;

      const sql = node.originalFilePath ? readFile(node.originalFilePath) : "";
      const joinCount = [...sql.matchAll(/\bjoin\b/gi)].length;
      if (joinCount === 0) continue;

      diagnostics.push(
        report(
          multipleSourcesJoined,
          diagnosticPathForNode(node),
          `Model "${node.name}" joins ${sourceParents.length} direct sources`,
          "Prefer staging each source first, then join curated staging models.",
        ),
      );
    }

    return diagnostics;
  },
};
