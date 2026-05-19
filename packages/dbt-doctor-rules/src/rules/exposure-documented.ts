import type { Rule } from "../types.js";
import { blockHasDescription, splitNamedYamlBlocks } from "../utils/yaml-blocks.js";
import { report } from "../utils/report.js";

export const exposureDocumented: Rule = {
  id: "exposure-documented",
  severity: "warn",
  category: "Governance",
  tags: ["enterprise"],
  recommendation: "Document exposures with description and owner",
  run: ({ yamlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of yamlFiles) {
      const content = readFile(file);
      if (!/^\s*exposures:/m.test(content)) continue;
      for (const exposure of splitNamedYamlBlocks(content, "exposures")) {
        if (blockHasDescription(exposure.block)) continue;
        diagnostics.push(
          report(
            exposureDocumented,
            file,
            `Exposure "${exposure.name}" is missing a description`,
            "Add description and owner under the exposure in YAML.",
          ),
        );
      }
    }
    return diagnostics;
  },
};
