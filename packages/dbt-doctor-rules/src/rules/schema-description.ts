import type { Rule } from "../types.js";
import { report } from "../utils/report.js";

const isSchemaFile = (file: string): boolean =>
  file.replace(/\\/g, "/").includes("/models/") && /\.(yml|yaml)$/.test(file);

export const schemaDescription: Rule = {
  id: "schema-description",
  severity: "warn",
  category: "Documentation",
  recommendation: "Add descriptions to models and columns in schema.yml",
  run: ({ yamlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of yamlFiles) {
      if (!isSchemaFile(file)) continue;
      const modelBlocks = readFile(file)
        .split(/\n\s*-\s+name:\s+/)
        .slice(1);
      for (const block of modelBlocks) {
        const modelName = block.match(/^["']?(\w+)/)?.[1];
        if (!modelName) continue;
        if (/description:\s*\S/.test(block.split("columns:")[0] ?? block)) continue;
        diagnostics.push(
          report(
            schemaDescription,
            file,
            `Model "${modelName}" is missing a description`,
            "Add a description field under the model in schema.yml.",
          ),
        );
      }
    }
    return diagnostics;
  },
};
