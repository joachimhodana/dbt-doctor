import path from "node:path";
import { findDbtProjectRoot, isFile } from "@dbt-doctor/project-info";

export const resolveDiagnoseTarget = (directory: string): string | null => {
  if (isFile(path.join(directory, "dbt_project.yml"))) return directory;
  return findDbtProjectRoot(directory);
};
