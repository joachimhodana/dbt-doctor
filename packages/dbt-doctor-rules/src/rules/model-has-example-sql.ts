import type { Rule } from "../types.js";
import { isModelSqlPath, isUnderModelsYaml, modelBaseName } from "../utils/model-paths.js";
import { report } from "../utils/report.js";
import { findModelBlock } from "../utils/yaml-blocks.js";

const hasExampleSql = (block: string): boolean =>
  /\bexample_sql:\s*\|/i.test(block) ||
  /\bexample_sql:\s*["'][^"']+["']/i.test(block) ||
  /\bmeta:\s*\n[\s\S]*?\bexample_sql:/i.test(block);

export const modelHasExampleSql: Rule = {
  id: "model-has-example-sql",
  severity: "warn",
  category: "Documentation",
  tags: ["strict"],
  recommendation: "Model metadata should include an example_sql snippet.",
  run: ({ sqlFiles, yamlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      if (!isModelSqlPath(file)) continue;
      const modelName = modelBaseName(file);
      const modelBlock = findModelBlock(modelName, yamlFiles, readFile, isUnderModelsYaml);
      if (!modelBlock || hasExampleSql(modelBlock.block)) continue;
      diagnostics.push(
        report(
          modelHasExampleSql,
          modelBlock.file,
          `Model "${modelName}" is missing example_sql metadata`,
          "Add meta.example_sql (or example_sql) with a representative query.",
        ),
      );
    }
    return diagnostics;
  },
};
