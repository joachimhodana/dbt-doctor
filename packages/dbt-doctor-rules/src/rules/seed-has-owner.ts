import path from "node:path";
import type { Rule } from "../types.js";
import { blockHasMetaOwner, findSeedBlock } from "../utils/yaml-blocks.js";
import { report } from "../utils/report.js";

const seedBaseName = (seedPath: string): string => path.basename(seedPath, path.extname(seedPath));

export const seedHasOwner: Rule = {
  id: "seed-has-owner",
  severity: "warn",
  category: "Governance",
  tags: ["strict"],
  recommendation: "Set meta.owner (or owner) on every documented seed for accountability",
  run: ({ seedDataFiles, yamlFiles, readFile }) => {
    if (seedDataFiles.length === 0) return [];
    const diagnostics = [];
    for (const file of seedDataFiles) {
      const name = seedBaseName(file);
      const yaml = findSeedBlock(name, yamlFiles, readFile);
      if (!yaml) continue;
      if (blockHasMetaOwner(yaml.block)) continue;
      diagnostics.push(
        report(
          seedHasOwner,
          yaml.file,
          `Seed "${name}" has no meta.owner (or owner) in YAML`,
          "Add meta.owner (or owner) under the seed entry in seeds/*.yml.",
        ),
      );
    }
    return diagnostics;
  },
};
