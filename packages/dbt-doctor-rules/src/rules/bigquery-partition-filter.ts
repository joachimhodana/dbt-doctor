import type { Rule } from "../types.js";
import { report } from "../utils/report.js";

export const bigqueryPartitionFilter: Rule = {
  id: "bigquery-partition-filter",
  severity: "warn",
  category: "Performance",
  tags: ["bigquery"],
  requiresAdapter: ["bigquery"],
  recommendation: "Filter on partition columns in BigQuery models",
  run: ({ sqlFiles, readFile, project }) => {
    if (project.adapter !== "bigquery") return [];
    const diagnostics = [];
    for (const file of sqlFiles) {
      const content = readFile(file);
      if (!/partition\s+by/i.test(content) && !/_PARTITIONDATE|_PARTITIONTIME/i.test(content)) {
        continue;
      }
      if (/\bwhere\b/i.test(content)) continue;
      diagnostics.push(
        report(
          bigqueryPartitionFilter,
          file,
          "BigQuery partitioned model may be missing a WHERE clause",
          "Filter on partition columns to limit bytes scanned.",
        ),
      );
    }
    return diagnostics;
  },
};
