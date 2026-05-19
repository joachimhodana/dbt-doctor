import { SOURCE_FILE_PATTERN } from "./constants.js";
import { YAML_SOURCE_PATTERN } from "@dbt-doctor/project-info";

export const computeSqlIncludePaths = (includePaths: string[]): string[] | undefined => {
  if (includePaths.length === 0) return undefined;
  return includePaths.filter(
    (filePath) => SOURCE_FILE_PATTERN.test(filePath) || YAML_SOURCE_PATTERN.test(filePath),
  );
};
