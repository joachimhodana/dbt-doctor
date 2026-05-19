import type { Rule } from "../types.js";
import { isModelSqlPath, isUnderModelsYaml, modelBaseName } from "../utils/model-paths.js";
import { blockHasContractEnforced, splitNamedYamlBlocks } from "../utils/yaml-blocks.js";
import { report } from "../utils/report.js";

const modelContractFromYaml = (
  modelName: string,
  yamlFiles: string[],
  readFile: (path: string) => string,
): boolean => {
  for (const file of yamlFiles) {
    if (!isUnderModelsYaml(file)) continue;
    if (!/\.(yml|yaml)$/i.test(file)) continue;
    for (const block of splitNamedYamlBlocks(readFile(file), "models")) {
      if (block.name === modelName && blockHasContractEnforced(block.block)) {
        return true;
      }
    }
  }
  return false;
};

export const modelContractEnforced: Rule = {
  id: "model-contract-enforced",
  severity: "warn",
  category: "Configuration",
  tags: ["strict"],
  recommendation: "Enable model contracts with contract.enforced: true in schema YAML",
  run: ({ sqlFiles, yamlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      if (!isModelSqlPath(file)) continue;
      const name = modelBaseName(file);
      if (modelContractFromYaml(name, yamlFiles, readFile)) continue;
      diagnostics.push(
        report(
          modelContractEnforced,
          file,
          `Model "${name}" does not set contract.enforced: true`,
          "Add contract: { enforced: true } under the model config in its YAML file.",
        ),
      );
    }
    return diagnostics;
  },
};
