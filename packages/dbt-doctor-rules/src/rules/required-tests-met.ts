import type { Rule } from "../types.js";
import { isModelSqlPath, isUnderModelsYaml, modelBaseName } from "../utils/model-paths.js";
import {
  resolveModelRequirements,
  resolveSeedRequirements,
  resolveSourceRequirements,
} from "../utils/required-model-config.js";
import { report } from "../utils/report.js";
import { countTestReferences } from "../utils/test-references.js";
import { findModelBlock, findSeedBlock, splitSourceTableBlocks } from "../utils/yaml-blocks.js";

const seedNameFromPath = (seedPath: string): string =>
  seedPath.replace(/^.*\//, "").replace(/\.[^.]+$/, "");

export const requiredTestsMet: Rule = {
  id: "required-tests-met",
  severity: "warn",
  category: "Testing",
  recommendation:
    "Satisfy +required_tests from dbt_project.yml by meeting minimum test counts per model path.",
  run: (context) => {
    const diagnostics = [];

    for (const file of context.sqlFiles) {
      if (!isModelSqlPath(file)) continue;

      const requirements = resolveModelRequirements(context, file);
      const requiredTests = requirements.requiredTests;
      if (Object.keys(requiredTests).length === 0) continue;

      const modelName = modelBaseName(file);
      const modelBlock = findModelBlock(
        modelName,
        context.yamlFiles,
        context.readFile,
        isUnderModelsYaml,
      );

      if (!modelBlock) {
        diagnostics.push(
          report(
            requiredTestsMet,
            file,
            `Model "${modelName}" is missing schema YAML required for +required_tests checks`,
            "Add model YAML and declare tests to meet +required_tests requirements.",
          ),
        );
        continue;
      }

      for (const [testName, requiredCount] of Object.entries(requiredTests)) {
        const actualCount = countTestReferences(modelBlock.block, testName);
        if (actualCount >= requiredCount) continue;

        diagnostics.push(
          report(
            requiredTestsMet,
            modelBlock.file,
            `Model "${modelName}" requires at least ${requiredCount} ${testName} test(s), found ${actualCount}`,
            `Add ${testName} tests to satisfy +required_tests (${requiredCount}).`,
          ),
        );
      }
    }

    for (const file of context.seedDataFiles) {
      const requirements = resolveSeedRequirements(context, file);
      const requiredTests = requirements.requiredTests;
      if (Object.keys(requiredTests).length === 0) continue;

      const seedName = seedNameFromPath(file);
      const seedBlock = findSeedBlock(seedName, context.yamlFiles, context.readFile);

      if (!seedBlock) {
        diagnostics.push(
          report(
            requiredTestsMet,
            file,
            `Seed "${seedName}" is missing YAML required for +required_tests checks`,
            "Add seed YAML and declare tests to meet +required_tests requirements.",
          ),
        );
        continue;
      }

      for (const [testName, requiredCount] of Object.entries(requiredTests)) {
        const actualCount = countTestReferences(seedBlock.block, testName);
        if (actualCount >= requiredCount) continue;

        diagnostics.push(
          report(
            requiredTestsMet,
            seedBlock.file,
            `Seed "${seedName}" requires at least ${requiredCount} ${testName} test(s), found ${actualCount}`,
            `Add ${testName} tests to satisfy +required_tests (${requiredCount}).`,
          ),
        );
      }
    }

    for (const file of context.yamlFiles) {
      if (!/\.(yml|yaml)$/i.test(file)) continue;
      const content = context.readFile(file);
      if (!/^\s*sources:\s*$/m.test(content)) continue;

      const requirements = resolveSourceRequirements(context, file);
      const requiredTests = requirements.requiredTests;
      if (Object.keys(requiredTests).length === 0) continue;

      for (const table of splitSourceTableBlocks(content)) {
        for (const [testName, requiredCount] of Object.entries(requiredTests)) {
          const actualCount = countTestReferences(table.block, testName);
          if (actualCount >= requiredCount) continue;

          diagnostics.push(
            report(
              requiredTestsMet,
              file,
              `Source table "${table.sourceName}.${table.tableName}" requires at least ${requiredCount} ${testName} test(s), found ${actualCount}`,
              `Add ${testName} tests to satisfy +required_tests (${requiredCount}).`,
            ),
          );
        }
      }
    }

    return diagnostics;
  },
};
