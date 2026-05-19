import { RECOMMENDED_DBT_PACKAGE_MARKERS } from "../constants.js";
import type { Rule } from "../types.js";
import { isMartModelPath } from "../utils/path-layer.js";
import { isModelSqlPath } from "../utils/model-paths.js";
import { report } from "../utils/report.js";

const expectationsMarker = RECOMMENDED_DBT_PACKAGE_MARKERS.find((m) => m.id === "dbt_expectations");

const hasExpectationsPackage = (packagesContent: string | null): boolean =>
  Boolean(
    packagesContent &&
    expectationsMarker?.patterns.some((pattern) => packagesContent.includes(pattern)),
  );

const yamlHasExpectationTest = (yamlFiles: string[], readFile: (p: string) => string): boolean => {
  for (const file of yamlFiles) {
    if (readFile(file).includes("dbt_expectations.")) return true;
  }
  return false;
};

export const dbtExpectationsHint: Rule = {
  id: "dbt-expectations-hint",
  severity: "warn",
  category: "Testing",
  tags: ["enterprise"],
  recommendation: "Use dbt_expectations for volume, freshness, and distribution tests on marts",
  run: ({ sqlFiles, yamlFiles, readFile }) => {
    const hasMart = sqlFiles.some((f) => isModelSqlPath(f) && isMartModelPath(f));
    if (!hasMart) return [];
    const packagesContent = yamlFiles.includes("packages.yml") ? readFile("packages.yml") : null;
    if (hasExpectationsPackage(packagesContent) && yamlHasExpectationTest(yamlFiles, readFile)) {
      return [];
    }
    const diagnostics = [];
    if (!hasExpectationsPackage(packagesContent)) {
      diagnostics.push(
        report(
          dbtExpectationsHint,
          "packages.yml",
          "Mart models present but dbt_expectations is not in packages.yml",
          "Add dbt_expectations to packages.yml.",
        ),
      );
    } else if (!yamlHasExpectationTest(yamlFiles, readFile)) {
      diagnostics.push(
        report(
          dbtExpectationsHint,
          "packages.yml",
          "dbt_expectations is installed but no expectation tests were found in YAML",
          "Add dbt_expectations.* tests on critical mart columns.",
        ),
      );
    }
    return diagnostics;
  },
};
