import { SOURCE_FILE_PATTERN } from "./constants.js";
import { YAML_SOURCE_PATTERN } from "@dbt-doctor/project-info";
import type { DbtDoctorConfig } from "@dbt-doctor/types";
import { compileIgnoredFilePatterns, isFileIgnoredByPatterns } from "./is-ignored-file.js";
import { listSourceFiles } from "./utils/list-source-files.js";

export const resolveLintIncludePaths = (
  rootDirectory: string,
  userConfig: DbtDoctorConfig | null,
): string[] | undefined => {
  if (!Array.isArray(userConfig?.ignore?.files) || userConfig.ignore.files.length === 0) {
    return undefined;
  }

  const ignoredPatterns = compileIgnoredFilePatterns(userConfig);

  const includedPaths = listSourceFiles(rootDirectory).filter((filePath) => {
    if (!SOURCE_FILE_PATTERN.test(filePath) && !YAML_SOURCE_PATTERN.test(filePath)) {
      return false;
    }

    return !isFileIgnoredByPatterns(filePath, rootDirectory, ignoredPatterns);
  });

  return includedPaths;
};
