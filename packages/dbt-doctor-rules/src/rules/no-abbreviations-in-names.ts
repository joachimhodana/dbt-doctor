import { NAME_ABBREVIATION_DENYLIST } from "../constants.js";
import type { Rule } from "../types.js";
import { isModelSqlPath, modelBaseName } from "../utils/model-paths.js";
import { report } from "../utils/report.js";

const LAYER_PREFIXES = ["stg", "int", "fct", "dim"] as const;

const findAbbreviations = (modelName: string): string[] => {
  const segments = modelName.toLowerCase().split("_").filter(Boolean);
  const hits: string[] = [];
  for (const segment of segments) {
    if (LAYER_PREFIXES.includes(segment as (typeof LAYER_PREFIXES)[number])) continue;
    if ((NAME_ABBREVIATION_DENYLIST as readonly string[]).includes(segment)) {
      hits.push(segment);
    }
  }
  return hits;
};

export const noAbbreviationsInNames: Rule = {
  id: "no-abbreviations-in-names",
  severity: "warn",
  category: "Best Practices",
  tags: ["strict", "style"],
  recommendation: "Use full words in model names instead of abbreviations (e.g. architecture not arch)",
  run: ({ sqlFiles }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      if (!isModelSqlPath(file)) continue;
      const name = modelBaseName(file);
      const abbreviations = findAbbreviations(name);
      if (abbreviations.length === 0) continue;
      diagnostics.push(
        report(
          noAbbreviationsInNames,
          file,
          `Model name "${name}" uses discouraged abbreviation(s): ${abbreviations.join(", ")}`,
          "Rename segments to full words for clarity (customer, transaction, quantity, etc.).",
        ),
      );
    }
    return diagnostics;
  },
};
