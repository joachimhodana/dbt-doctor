import type { Rule } from "../types.js";
import { isModelSqlPath, modelBaseName } from "../utils/model-paths.js";
import { report } from "../utils/report.js";

const DEFAULT_MESSAGE =
  'Configure `rules.model-name-contract.pattern` in .dbt-doctor to enforce a naming regex.';

const resolvePattern = (value: unknown): RegExp | null => {
  if (typeof value !== "string" || value.trim().length === 0) return null;
  try {
    return new RegExp(value);
  } catch {
    return null;
  }
};

export const modelNameContract: Rule = {
  id: "model-name-contract",
  severity: "warn",
  category: "Governance",
  recommendation: DEFAULT_MESSAGE,
  run: (context) => {
    const configuredPattern = resolvePattern(context.ruleConfig.pattern);
    if (!configuredPattern) return [];

    const diagnostics = [];
    for (const file of context.sqlFiles) {
      if (!isModelSqlPath(file)) continue;
      const modelName = modelBaseName(file);
      if (configuredPattern.test(modelName)) continue;

      diagnostics.push(
        report(
          modelNameContract,
          file,
          `Model name "${modelName}" does not match configured pattern ${configuredPattern}`,
          `Rename the model to satisfy pattern: ${configuredPattern}`,
        ),
      );
    }

    return diagnostics;
  },
};
