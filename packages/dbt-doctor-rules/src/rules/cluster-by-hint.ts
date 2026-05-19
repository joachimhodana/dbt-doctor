import { LARGE_MODEL_LINE_COUNT } from "../constants.js";
import type { Rule } from "../types.js";
import { isModelSqlPath, isUnderModelsYaml, modelBaseName } from "../utils/model-paths.js";
import { blockHasClusterBy, findModelBlock } from "../utils/yaml-blocks.js";
import { report } from "../utils/report.js";

export const clusterByHint: Rule = {
  id: "cluster-by-hint",
  severity: "warn",
  category: "Performance",
  tags: ["enterprise", "bigquery"],
  requiresAdapter: ["bigquery"],
  recommendation: "Large BigQuery models benefit from cluster_by in config",
  run: ({ sqlFiles, yamlFiles, readFile, project }) => {
    if (project.adapter !== "bigquery") return [];
    const diagnostics = [];
    for (const file of sqlFiles) {
      if (!isModelSqlPath(file)) continue;
      const sql = readFile(file);
      const lineCount = sql.split("\n").length;
      const name = modelBaseName(file);
      const yaml = findModelBlock(name, yamlFiles, readFile, isUnderModelsYaml);
      const isLarge =
        lineCount >= LARGE_MODEL_LINE_COUNT || /materialized:\s*table/i.test(yaml?.block ?? sql);
      if (!isLarge) continue;
      if (yaml && blockHasClusterBy(yaml.block)) continue;
      if (/cluster_by\s*=/i.test(sql)) continue;
      diagnostics.push(
        report(
          clusterByHint,
          file,
          `Large BigQuery model "${name}" has no cluster_by configuration`,
          "Add cluster_by in model config to reduce scan cost for filtered queries.",
        ),
      );
    }
    return diagnostics;
  },
};
