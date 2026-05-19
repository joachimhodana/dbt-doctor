import type { Rule } from "../types.js";
import { isModelsRootSqlFile } from "../utils/path-layer.js";
import { report } from "../utils/report.js";

/**
 * Models should live under layer folders (staging, intermediate, marts).
 * @see https://docs.getdbt.com/best-practices/how-we-structure/1-guide-overview
 */
export const modelOutsideLayerFolder: Rule = {
  id: "model-outside-layer-folder",
  severity: "warn",
  category: "Structure",
  recommendation: "Place models under staging/, intermediate/, or marts/ subfolders",
  run: ({ sqlFiles }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      if (!isModelsRootSqlFile(file)) continue;
      diagnostics.push(
        report(
          modelOutsideLayerFolder,
          file,
          "SQL model sits directly under models/ without a layer subfolder",
          "Move to models/staging/, models/intermediate/, or models/marts/.",
        ),
      );
    }
    return diagnostics;
  },
};
