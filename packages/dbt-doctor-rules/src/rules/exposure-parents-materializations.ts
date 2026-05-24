import type { Rule } from "../types.js";
import {
  diagnosticPathForNode,
  isExposureNode,
  isModelNode,
  parentNodes,
} from "../utils/manifest-graph.js";
import { report } from "../utils/report.js";

const isRiskyMaterialization = (materialized: string | null): boolean =>
  materialized === "view" || materialized === "ephemeral";

export const exposureParentsMaterializations: Rule = {
  id: "exposure-parents-materializations",
  severity: "warn",
  category: "Performance",
  requiresManifest: true,
  recommendation: "Exposures should avoid depending on fragile view/ephemeral parent models.",
  run: ({ manifest }) => {
    if (!manifest) return [];

    const diagnostics = [];

    for (const node of Object.values(manifest.nodes)) {
      if (!isExposureNode(node)) continue;

      for (const parent of parentNodes(manifest, node)) {
        if (!isModelNode(parent)) continue;
        if (!isRiskyMaterialization(parent.materialized)) continue;

        diagnostics.push(
          report(
            exposureParentsMaterializations,
            diagnosticPathForNode(node),
            `Exposure "${node.name}" depends on ${parent.materialized ?? "unknown"} model "${parent.name}"`,
            "Prefer stable table/incremental parents for production exposures.",
          ),
        );
      }
    }

    return diagnostics;
  },
};
