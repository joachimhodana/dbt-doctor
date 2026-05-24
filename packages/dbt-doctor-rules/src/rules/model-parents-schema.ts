import type { Rule } from "../types.js";
import { report } from "../utils/report.js";
import { isModelNode, parentNodes, diagnosticPathForNode } from "../utils/manifest-graph.js";

const schemaFromPath = (path: string | null): string | null => {
  const normalized = (path ?? "").replace(/\\/g, "/");
  const parts = normalized.split("/");
  const modelsIdx = parts.indexOf("models");
  if (modelsIdx < 0 || modelsIdx + 1 >= parts.length) return null;
  return parts[modelsIdx + 1] || null;
};

export const modelParentsSchema: Rule = {
  id: "model-parents-schema",
  severity: "warn",
  category: "Architecture",
  requiresManifest: true,
  recommendation: "Keep parent models in expected schemas/folders.",
  run: (context) => {
    if (!context.manifest) return [];
    const expected =
      typeof context.ruleConfig.equals === "string" ? context.ruleConfig.equals : null;
    if (!expected) return [];

    const diagnostics = [];
    for (const node of Object.values(context.manifest.nodes)) {
      if (!isModelNode(node)) continue;
      for (const parent of parentNodes(context.manifest, node)) {
        if (!isModelNode(parent)) continue;
        const schema = schemaFromPath(parent.originalFilePath ?? parent.path);
        if (schema === expected) continue;
        diagnostics.push(
          report(
            modelParentsSchema,
            diagnosticPathForNode(node),
            `Model "${node.name}" has parent "${parent.name}" outside expected schema "${expected}"`,
            `Move parent models into schema/folder "${expected}" or adjust config.`,
          ),
        );
      }
    }
    return diagnostics;
  },
};
