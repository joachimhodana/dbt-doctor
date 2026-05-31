import type { Rule } from "../types.js";
import { isIncrementalModel } from "../utils/incremental-model.js";
import { isModelSqlPath, isUnderModelsYaml, modelBaseName } from "../utils/model-paths.js";
import { findModelBlock } from "../utils/yaml-blocks.js";
import { report } from "../utils/report.js";

const hasUniqueKey = (sql: string, yamlBlock: string | null): boolean =>
  /unique_key\s*=/i.test(sql) || /unique_key:/i.test(yamlBlock ?? "");

export const incrementalUniqueKey: Rule = {
  id: "incremental-unique-key",
  severity: "error",
  category: "Configuration",
  tags: ["enterprise"],
  recommendation: "Incremental models must declare unique_key",
  run: ({ sqlFiles, yamlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      if (!isModelSqlPath(file)) continue;
      const sql = readFile(file);
      const name = modelBaseName(file);
      const yaml = findModelBlock(name, yamlFiles, readFile, isUnderModelsYaml);
      const yamlText = yaml?.block ?? null;
      if (!isIncrementalModel(sql, yamlText)) continue;
      if (hasUniqueKey(sql, yamlText)) continue;
      diagnostics.push(
        report(
          incrementalUniqueKey,
          file,
          `Incremental model "${name}" has no unique_key configured`,
          "Add unique_key in {{ config() }} or model YAML for merge strategy safety.",
        ),
      );
    }
    return diagnostics;
  },
};
