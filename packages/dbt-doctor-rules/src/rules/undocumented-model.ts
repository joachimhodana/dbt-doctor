import type { Rule } from "../types.js";
import { isModelSqlPath, isUnderModelsYaml, modelBaseName } from "../utils/model-paths.js";
import { splitNamedYamlBlocks } from "../utils/yaml-blocks.js";
import { report } from "../utils/report.js";

const collectDocumentedModelNames = (
  yamlFiles: string[],
  readFile: (path: string) => string,
): Set<string> => {
  const names = new Set<string>();
  for (const file of yamlFiles) {
    if (!isUnderModelsYaml(file)) continue;
    if (!/\.(yml|yaml)$/i.test(file)) continue;
    for (const block of splitNamedYamlBlocks(readFile(file), "models")) {
      names.add(block.name);
    }
  }
  return names;
};

export const undocumentedModel: Rule = {
  id: "undocumented-model",
  severity: "warn",
  category: "Documentation",
  tags: ["strict"],
  recommendation: "Declare every model in a schema YAML file with name and description",
  run: ({ sqlFiles, yamlFiles, readFile }) => {
    const documented = collectDocumentedModelNames(yamlFiles, readFile);
    const diagnostics = [];
    for (const file of sqlFiles) {
      if (!isModelSqlPath(file)) continue;
      const name = modelBaseName(file);
      if (documented.has(name)) continue;
      diagnostics.push(
        report(
          undocumentedModel,
          file,
          `Model "${name}" is not declared in any models/schema YAML`,
          `Add ${name}.yml with a models: entry and description.`,
        ),
      );
    }
    return diagnostics;
  },
};
