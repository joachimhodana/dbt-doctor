import { CANONICAL_MODEL_LAYER_FOLDERS } from "../constants.js";
import type { Rule } from "../types.js";
import { isModelSqlPath } from "../utils/model-paths.js";
import { modelLayerFolder } from "../utils/path-layer.js";
import { report } from "../utils/report.js";

export const nonCanonicalLayerFolder: Rule = {
  id: "non-canonical-layer-folder",
  severity: "warn",
  category: "Structure",
  tags: ["enterprise"],
  recommendation: "Use standard layer folders (staging, intermediate, marts, utilities)",
  run: ({ sqlFiles }) => {
    const diagnostics = [];
    const seen = new Set<string>();
    for (const file of sqlFiles) {
      if (!isModelSqlPath(file)) continue;
      const layer = modelLayerFolder(file);
      if (!layer || CANONICAL_MODEL_LAYER_FOLDERS.has(layer)) continue;
      const key = layer;
      if (seen.has(key)) continue;
      seen.add(key);
      diagnostics.push(
        report(
          nonCanonicalLayerFolder,
          file,
          `Non-standard models layer folder "${layer}" (expected staging, intermediate, marts, or utilities)`,
          "Align folder names with dbt Labs structure or document an allowlist in config.",
        ),
      );
    }
    return diagnostics;
  },
};
