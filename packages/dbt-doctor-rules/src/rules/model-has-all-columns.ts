import type { Rule } from "../types.js";
import { report } from "../utils/report.js";
import { diagnosticPathForNode } from "../utils/manifest-graph.js";

const parseExpectedColumns = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string" && v.length > 0);
};

export const modelHasAllColumns: Rule = {
  id: "model-has-all-columns",
  severity: "warn",
  category: "Governance",
  requiresManifest: true,
  recommendation:
    "Set `rules.model-has-all-columns.required=[...]` (JSON config) to enforce required manifest-described columns.",
  run: (context) => {
    if (!context.manifest) return [];
    const required = parseExpectedColumns(context.ruleConfig.required);
    if (required.length === 0) return [];

    const diagnostics = [];
    for (const node of Object.values(context.manifest.nodes)) {
      if (node.resourceType !== "model") continue;
      const desc = (node.description ?? "").toLowerCase();
      const missing = required.filter((col) => !desc.includes(col.toLowerCase()));
      if (missing.length === 0) continue;

      diagnostics.push(
        report(
          modelHasAllColumns,
          diagnosticPathForNode(node),
          `Model "${node.name}" is missing required documented columns: ${missing.join(", ")}`,
          "Ensure manifest metadata includes all required columns.",
        ),
      );
    }
    return diagnostics;
  },
};
