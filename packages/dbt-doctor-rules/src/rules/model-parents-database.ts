import type { Rule } from "../types.js";
import { report } from "../utils/report.js";
import { isModelNode, parentNodes, diagnosticPathForNode } from "../utils/manifest-graph.js";

const dbFromPath = (path: string | null): string | null => {
  const normalized = (path ?? "").replace(/\\/g, "/");
  const match = normalized.match(/\b([a-zA-Z_][\w]*)\.[a-zA-Z_][\w]*\.[a-zA-Z_][\w]*/);
  return match?.[1] ?? null;
};

export const modelParentsDatabase: Rule = {
  id: "model-parents-database",
  severity: "warn",
  category: "Architecture",
  requiresManifest: true,
  recommendation: "Parent model dependencies should come from expected database.",
  run: (context) => {
    if (!context.manifest) return [];
    const expected = typeof context.ruleConfig.equals === "string" ? context.ruleConfig.equals : null;
    if (!expected) return [];

    const diagnostics = [];
    for (const node of Object.values(context.manifest.nodes)) {
      if (!isModelNode(node)) continue;
      for (const parent of parentNodes(context.manifest, node)) {
        if (!isModelNode(parent)) continue;
        const parentDb = dbFromPath(parent.path);
        if (!parentDb || parentDb === expected) continue;

        diagnostics.push(
          report(
            modelParentsDatabase,
            diagnosticPathForNode(node),
            `Model "${node.name}" has parent "${parent.name}" in database "${parentDb}" (expected "${expected}")`,
            `Align parent dependencies to database "${expected}" or relax the rule config.`,
          ),
        );
      }
    }
    return diagnostics;
  },
};
