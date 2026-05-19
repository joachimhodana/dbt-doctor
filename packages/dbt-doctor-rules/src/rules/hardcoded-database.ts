import type { Rule } from "../types.js";
import { report } from "../utils/report.js";

const THREE_PART_FROM = /\bfrom\s+[`"']?[\w-]+\.[\w-]+\.[\w-]+[`"']?/i;
const TWO_PART_FROM = /\bfrom\s+[`"']?[\w-]+\.[\w-]+[`"']?/i;

const hasHardcodedRelation = (content: string): boolean => {
  if (THREE_PART_FROM.test(content)) return true;
  if (!TWO_PART_FROM.test(content)) return false;
  if (/\{\{-?\s*(ref|source)\s*\(/.test(content)) return false;
  return true;
};

/** Mirrors dbt_project_evaluator `fct_hard_coded_references`. */
export const hardcodedDatabase: Rule = {
  id: "hardcoded-database",
  severity: "error",
  category: "Architecture",
  recommendation: "Use {{ ref() }} and {{ source() }} instead of schema.table literals",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      const content = readFile(file);
      if (!hasHardcodedRelation(content)) continue;
      if (/\{\{\s*target\./.test(content) || /\{\{\s*var\(/.test(content)) continue;
      diagnostics.push(
        report(
          hardcodedDatabase,
          file,
          "Hard-coded relation reference (schema.table) instead of ref() or source()",
          "Replace with {{ ref('model_name') }} or {{ source('source_name', 'table') }}.",
        ),
      );
    }
    return diagnostics;
  },
};
