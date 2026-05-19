import { RECOMMENDED_DBT_PACKAGE_MARKERS } from "../constants.js";
import type { Rule } from "../types.js";
import { report } from "../utils/report.js";

const packagesContent = (yamlFiles: string[], readFile: (path: string) => string): string | null => {
  if (!yamlFiles.includes("packages.yml")) return null;
  return readFile("packages.yml");
};

const markerPresent = (content: string, patterns: readonly string[]): boolean =>
  patterns.some((pattern) => content.includes(pattern));

export const recommendedDbtPackages: Rule = {
  id: "recommended-dbt-packages",
  severity: "warn",
  category: "Best Practices",
  tags: ["strict"],
  recommendation:
    "Add dbt_utils, dbt_date, and dbt_expectations (or successors) via packages.yml for standard macros and tests",
  run: ({ yamlFiles, readFile }) => {
    const content = packagesContent(yamlFiles, readFile);
    const diagnostics = [];
    if (content === null) {
      diagnostics.push(
        report(
          recommendedDbtPackages,
          "packages.yml",
          "No packages.yml found — recommended dbt packages are not declared",
          "Create packages.yml with dbt-labs/dbt_utils, godatadriven/dbt_date, and metaplane/dbt_expectations.",
        ),
      );
      return diagnostics;
    }
    for (const { id, patterns } of RECOMMENDED_DBT_PACKAGE_MARKERS) {
      if (markerPresent(content, patterns)) continue;
      diagnostics.push(
        report(
          recommendedDbtPackages,
          "packages.yml",
          `packages.yml does not reference ${id}`,
          `Add a packages: entry for ${id} (see dbt package hub for current package coordinates).`,
        ),
      );
    }
    return diagnostics;
  },
};
