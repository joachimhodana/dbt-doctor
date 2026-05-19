import path from "node:path";
import type { Rule } from "../types.js";
import { splitNamedYamlBlocks, blockHasDescription } from "../utils/yaml-blocks.js";
import { report } from "../utils/report.js";

const seedBaseName = (seedPath: string): string => path.basename(seedPath, path.extname(seedPath));

const collectDocumentedSeeds = (
  yamlFiles: string[],
  readFile: (path: string) => string,
): Map<string, string> => {
  const documented = new Map<string, string>();
  for (const file of yamlFiles) {
    const relative = file.replace(/\\/g, "/");
    if (!relative.includes("/seeds/") && !relative.startsWith("seeds/") && relative !== "seeds") continue;
    if (!/\.(yml|yaml)$/i.test(file)) continue;
    for (const block of splitNamedYamlBlocks(readFile(file), "seeds")) {
      if (blockHasDescription(block.block)) {
        documented.set(block.name, file);
      }
    }
  }
  return documented;
};

export const seedDocumented: Rule = {
  id: "seed-documented",
  severity: "warn",
  category: "Documentation",
  tags: ["strict"],
  recommendation: "Document every seed in YAML with a description",
  run: ({ seedDataFiles, yamlFiles, readFile }) => {
    if (seedDataFiles.length === 0) return [];
    const documented = collectDocumentedSeeds(yamlFiles, readFile);
    const diagnostics = [];
    for (const file of seedDataFiles) {
      const name = seedBaseName(file);
      if (documented.has(name)) continue;
      diagnostics.push(
        report(
          seedDocumented,
          file,
          `Seed "${name}" has no description in seeds YAML`,
          `Add ${name} under seeds: in a .yml file with a description field.`,
        ),
      );
    }
    return diagnostics;
  },
};
