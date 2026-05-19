import path from "node:path";
import { isDirectory } from "@dbt-doctor/project-info";
import type { DbtDoctorConfig } from "@dbt-doctor/types";
import { logger } from "./logger.js";

export const resolveConfigRootDir = (
  config: DbtDoctorConfig | null,
  configSourceDirectory: string | null,
): string | null => {
  if (!config || !configSourceDirectory) return null;

  const rawRootDir = config.rootDir;
  if (typeof rawRootDir !== "string") return null;

  const trimmedRootDir = rawRootDir.trim();
  if (trimmedRootDir.length === 0) return null;

  const resolvedRootDir = path.isAbsolute(trimmedRootDir)
    ? trimmedRootDir
    : path.resolve(configSourceDirectory, trimmedRootDir);

  if (resolvedRootDir === configSourceDirectory) return null;

  if (!isDirectory(resolvedRootDir)) {
    logger.warn(
      `dbt-doctor config "rootDir" points to "${rawRootDir}" (resolved to ${resolvedRootDir}), which is not a directory. Ignoring.`,
    );
    return null;
  }

  return resolvedRootDir;
};
