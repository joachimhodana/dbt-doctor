import type { Rule } from "../types.js";
import { report } from "../utils/report.js";
import { blockHasDescription, splitColumnBlocks, splitSourceTableBlocks } from "../utils/yaml-blocks.js";

export const sourceColumnsHaveDesc: Rule = {
  id: "source-columns-have-desc",
  severity: "warn",
  category: "Documentation",
  recommendation: "Describe every column on every source table.",
  run: ({ yamlFiles, readFile }) => {
    const diagnostics = [];

    for (const file of yamlFiles) {
      const content = readFile(file);
      if (!/^\s*sources:\s*$/m.test(content)) continue;

      for (const table of splitSourceTableBlocks(content)) {
        for (const column of splitColumnBlocks(table.block)) {
          if (blockHasDescription(column.block)) continue;
          diagnostics.push(
            report(
              sourceColumnsHaveDesc,
              file,
              `Source column "${table.sourceName}.${table.tableName}.${column.name}" is missing a description`,
              "Add a non-empty description: field under the source table column.",
            ),
          );
        }
      }
    }

    return diagnostics;
  },
};
