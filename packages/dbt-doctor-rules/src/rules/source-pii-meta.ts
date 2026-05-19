import type { Rule } from "../types.js";
import { PII_COLUMN_NAME_PATTERN } from "../constants.js";
import { isUnderModelsYaml } from "../utils/model-paths.js";
import { splitColumnBlocks, splitNamedYamlBlocks } from "../utils/yaml-blocks.js";
import { report } from "../utils/report.js";

const columnHasPiiMeta = (block: string): boolean =>
  /meta:\s*\n[\s\S]*?\b(pii|sensitive|confidential)\b/i.test(block) ||
  /\b(pii|sensitive|confidential):\s*true/i.test(block);

export const sourcePiiMeta: Rule = {
  id: "source-pii-meta",
  severity: "warn",
  category: "Governance",
  tags: ["enterprise"],
  recommendation: "Tag PII columns with meta (pii, sensitive) for governance",
  run: ({ yamlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of yamlFiles) {
      if (!isUnderModelsYaml(file) && !file.includes("_sources")) continue;
      const listKey = /^\s*sources:/m.test(readFile(file)) ? "sources" : "models";
      for (const entity of splitNamedYamlBlocks(readFile(file), listKey)) {
        for (const column of splitColumnBlocks(entity.block)) {
          if (!PII_COLUMN_NAME_PATTERN.test(column.name)) continue;
          if (columnHasPiiMeta(column.block)) continue;
          diagnostics.push(
            report(
              sourcePiiMeta,
              file,
              `Column "${column.name}" on "${entity.name}" looks like PII but has no governance meta`,
              'Add meta: { pii: true } or tags for catalog and access policies.',
            ),
          );
        }
      }
    }
    return diagnostics;
  },
};
