import type { Rule } from "../types.js";
import { isModelSqlPath, modelBaseName, siblingModelYamlCandidates } from "../utils/model-paths.js";
import { report } from "../utils/report.js";

export const perModelSchemaYml: Rule = {
  id: "per-model-schema-yml",
  severity: "warn",
  category: "Documentation",
  tags: ["strict"],
  recommendation: "Add a schema YAML file named after each model (e.g. stg_orders.yml for stg_orders.sql)",
  run: ({ sqlFiles, fileExists }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      if (!isModelSqlPath(file)) continue;
      const hasSidecar = siblingModelYamlCandidates(file).some((candidate) => fileExists(candidate));
      if (hasSidecar) continue;
      const name = modelBaseName(file);
      diagnostics.push(
        report(
          perModelSchemaYml,
          file,
          `Model "${name}" has no matching ${name}.yml (or .yaml) beside the SQL file`,
          "Use one YAML file per model with the same basename instead of only a shared schema.yml.",
        ),
      );
    }
    return diagnostics;
  },
};
