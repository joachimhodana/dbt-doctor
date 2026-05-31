import type { Rule } from "../types.js";
import { report } from "../utils/report.js";
import { splitColumnBlocks, splitNamedYamlBlocks } from "../utils/yaml-blocks.js";

const hasDescription = (columnBlock: string): boolean => /description:\s*\S/.test(columnBlock);

const isSeedYaml = (filePath: string): boolean => {
  const normalized = filePath.replace(/\\/g, "/");
  return normalized.includes("/seeds/") || normalized.startsWith("seeds/");
};

export const seedColumnsHaveDescription: Rule = {
  id: "seed-columns-have-description",
  severity: "warn",
  category: "Documentation",
  tags: ["strict"],
  recommendation: "Seed columns should include descriptions.",
  run: ({ yamlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of yamlFiles) {
      if (!isSeedYaml(file) || !/\.(yml|yaml)$/i.test(file)) continue;
      const content = readFile(file);
      for (const seedBlock of splitNamedYamlBlocks(content, "seeds")) {
        for (const column of splitColumnBlocks(seedBlock.block)) {
          if (hasDescription(column.block)) continue;
          diagnostics.push(
            report(
              seedColumnsHaveDescription,
              file,
              `Seed column "${seedBlock.name}.${column.name}" is missing a description`,
              "Add description to each seed column block.",
            ),
          );
        }
      }
    }
    return diagnostics;
  },
};
