import type { Rule } from "../types.js";
import { isModelSqlPath, modelBaseName } from "../utils/model-paths.js";
import {
  isIntermediateModelPath,
  isMartModelPath,
  isStagingModelPath,
} from "../utils/path-layer.js";
import { report } from "../utils/report.js";

export const modelPathLayerMismatch: Rule = {
  id: "model-path-layer-mismatch",
  severity: "warn",
  category: "Naming",
  tags: ["enterprise"],
  recommendation: "Model name prefix should match its layer folder (stg_, int_, fct_/dim_)",
  run: ({ sqlFiles }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      if (!isModelSqlPath(file)) continue;
      const name = modelBaseName(file);
      if (name.startsWith("stg_") && !isStagingModelPath(file)) {
        diagnostics.push(
          report(
            modelPathLayerMismatch,
            file,
            `Model "${name}" uses stg_ prefix but is not under a staging layer path`,
            "Move to models/staging/ (or stg/) or rename to match the folder.",
          ),
        );
      } else if (name.startsWith("int_") && !isIntermediateModelPath(file)) {
        diagnostics.push(
          report(
            modelPathLayerMismatch,
            file,
            `Model "${name}" uses int_ prefix but is not under an intermediate layer path`,
            "Move to models/intermediate/ (or int/) or rename to match the folder.",
          ),
        );
      } else if ((name.startsWith("fct_") || name.startsWith("dim_")) && !isMartModelPath(file)) {
        diagnostics.push(
          report(
            modelPathLayerMismatch,
            file,
            `Model "${name}" uses mart prefix but is not under a marts layer path`,
            "Move to models/marts/ (or mart/) or rename to match the folder.",
          ),
        );
      }
    }
    return diagnostics;
  },
};
