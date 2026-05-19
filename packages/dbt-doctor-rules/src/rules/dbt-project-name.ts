import type { Rule } from "../types.js";
import { report } from "../utils/report.js";

export const dbtProjectName: Rule = {
  id: "dbt-project-name",
  severity: "error",
  category: "Configuration",
  recommendation: "Set name in dbt_project.yml",
  run: ({ project, readFile }) => {
    if (project.projectName && project.projectName !== "unknown") return [];
    if (/^name:\s*\S/m.test(readFile("dbt_project.yml"))) return [];
    return [
      report(
        dbtProjectName,
        "dbt_project.yml",
        "dbt_project.yml is missing a project name",
        'Add `name: "your_project"` at the top of dbt_project.yml.',
      ),
    ];
  },
};
