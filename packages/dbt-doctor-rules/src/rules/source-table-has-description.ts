import type { Rule } from "../types.js";
import { report } from "../utils/report.js";
import { blockHasDescription, splitSourceTableBlocks } from "../utils/yaml-blocks.js";

export const sourceTableHasDescription: Rule = {
  id: "source-table-has-description",
  severity: "warn",
  category: "Documentation",
  tags: ["strict"],
  recommendation: "Document every source table with a non-empty description.",
  run: ({ yamlFiles, readFile }) => {
    const diagnostics = [];

    for (const file of yamlFiles) {
      const content = readFile(file);
      if (!/^\s*sources:\s*$/m.test(content)) continue;

      for (const table of splitSourceTableBlocks(content)) {
        if (blockHasDescription(table.block)) continue;

        diagnostics.push(
          report(
            sourceTableHasDescription,
            file,
            `Source table "${table.sourceName}.${table.tableName}" is missing a description`,
            "Add a non-empty description: field on the source table block.",
          ),
        );
      }
    }

    return diagnostics;
  },
};
