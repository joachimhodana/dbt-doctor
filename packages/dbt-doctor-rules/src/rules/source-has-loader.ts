import type { Rule } from "../types.js";
import { report } from "../utils/report.js";
import { splitNamedYamlBlocks } from "../utils/yaml-blocks.js";

const hasLoader = (block: string): boolean => /\bloader:\s*\S+/i.test(block);

export const sourceHasLoader: Rule = {
  id: "source-has-loader",
  severity: "warn",
  category: "Governance",
  recommendation: "Declare `loader:` for each source in source YAML.",
  run: (context) => {
    const diagnostics = [];

    for (const file of context.yamlFiles) {
      if (!/\.(yml|yaml)$/i.test(file)) continue;
      const content = context.readFile(file);
      if (!/^\s*sources:\s*$/m.test(content)) continue;

      for (const source of splitNamedYamlBlocks(content, "sources")) {
        if (hasLoader(source.block)) continue;
        diagnostics.push(
          report(
            sourceHasLoader,
            file,
            `Source "${source.name}" is missing loader`,
            "Add a loader value under the source block (for example: loader: fivetran).",
          ),
        );
      }
    }

    return diagnostics;
  },
};
