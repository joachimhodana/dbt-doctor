import type { Rule } from "../types.js";
import { report } from "../utils/report.js";
import { splitNamedYamlBlocks } from "../utils/yaml-blocks.js";

const hasDescriptionBeforeTables = (block: string): boolean => {
  const head = block.split(/\n\s*tables:\s*\n/)[0] ?? block;
  return /\bdescription:\s*\S/i.test(head);
};

export const sourceHasDescription: Rule = {
  id: "source-has-description",
  severity: "warn",
  category: "Documentation",
  tags: ["strict"],
  recommendation: "Document each source definition with a non-empty description.",
  run: ({ yamlFiles, readFile }) => {
    const diagnostics = [];

    for (const file of yamlFiles) {
      const content = readFile(file);
      if (!/^\s*sources:\s*$/m.test(content)) continue;

      for (const source of splitNamedYamlBlocks(content, "sources")) {
        if (hasDescriptionBeforeTables(source.block)) continue;
        diagnostics.push(
          report(
            sourceHasDescription,
            file,
            `Source "${source.name}" is missing a description`,
            "Add a non-empty description: field on the source block.",
          ),
        );
      }
    }

    return diagnostics;
  },
};
