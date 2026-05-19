import type { Rule } from "../types.js";
import { isMartModelPath } from "../utils/path-layer.js";
import { isModelSqlPath, isUnderModelsYaml, modelBaseName } from "../utils/model-paths.js";
import { findModelBlock } from "../utils/yaml-blocks.js";
import { report } from "../utils/report.js";

const modelBlockHasTests = (block: string): boolean =>
  /\ntests:\s*\n/.test(block) ||
  /-\s+not_null\b/.test(block) ||
  /-\s+unique\b/.test(block) ||
  /dbt_expectations\./.test(block) ||
  /relationships:/.test(block);

export const modelHasTests: Rule = {
  id: "model-has-tests",
  severity: "warn",
  category: "Testing",
  tags: ["enterprise"],
  recommendation: "Mart models should declare at least one test in YAML",
  run: ({ sqlFiles, yamlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      if (!isModelSqlPath(file) || !isMartModelPath(file)) continue;
      const name = modelBaseName(file);
      const yaml = findModelBlock(name, yamlFiles, readFile, isUnderModelsYaml);
      if (yaml && modelBlockHasTests(yaml.block)) continue;
      diagnostics.push(
        report(
          modelHasTests,
          file,
          `Mart model "${name}" has no tests declared in YAML`,
          "Add model- or column-level tests (not_null, unique, relationships, expectations).",
        ),
      );
    }
    return diagnostics;
  },
};
