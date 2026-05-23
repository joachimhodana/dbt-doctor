import type { Rule } from "../types.js";
import { isModelSqlPath, isUnderModelsYaml, modelBaseName } from "../utils/model-paths.js";
import { findModelBlock, splitColumnBlocks } from "../utils/yaml-blocks.js";
import { report } from "../utils/report.js";

interface PatternRule {
  matcher: RegExp;
  pattern: RegExp;
  source: string;
}

const compile = (raw: unknown): RegExp | null => {
  if (typeof raw !== "string" || raw.trim().length === 0) return null;
  try {
    return new RegExp(raw);
  } catch {
    return null;
  }
};

const parseRules = (ruleConfig: Record<string, unknown>): PatternRule[] => {
  const rules: PatternRule[] = [];

  for (const [key, value] of Object.entries(ruleConfig)) {
    if (!key.startsWith("pattern.")) continue;
    const target = key.slice("pattern.".length).trim();
    if (target.length === 0) continue;
    const pattern = compile(value);
    if (!pattern) continue;

    if (target.startsWith("re:")) {
      const rawMatcher = target.slice(3);
      const matcher = compile(rawMatcher);
      if (!matcher) continue;
      rules.push({ matcher, pattern, source: key });
    } else {
      const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      rules.push({ matcher: new RegExp(escaped), pattern, source: key });
    }
  }

  return rules;
};

export const columnNameContract: Rule = {
  id: "column-name-contract",
  severity: "warn",
  category: "Governance",
  recommendation:
    "Set `rules.column-name-contract.pattern.<matcher>=<regex>` in .dbt-doctor to enforce column naming contracts.",
  run: (context) => {
    const rules = parseRules(context.ruleConfig);
    if (rules.length === 0) return [];

    const diagnostics = [];

    for (const file of context.sqlFiles) {
      if (!isModelSqlPath(file)) continue;
      const modelName = modelBaseName(file);
      const modelBlock = findModelBlock(modelName, context.yamlFiles, context.readFile, isUnderModelsYaml);
      if (!modelBlock) continue;

      for (const column of splitColumnBlocks(modelBlock.block)) {
        for (const rule of rules) {
          if (!rule.matcher.test(column.name)) continue;
          if (rule.pattern.test(column.name)) continue;

          diagnostics.push(
            report(
              columnNameContract,
              modelBlock.file,
              `Column "${column.name}" in model "${modelName}" does not match configured contract ${rule.pattern}`,
              `Update the column name to satisfy ${rule.source}.`,
            ),
          );
        }
      }
    }

    return diagnostics;
  },
};
