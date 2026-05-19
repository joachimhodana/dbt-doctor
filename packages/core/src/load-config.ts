import fs from "node:fs";
import path from "node:path";
import type { DbtDoctorConfig } from "@dbt-doctor/types";
import { isFile, isMonorepoRoot } from "@dbt-doctor/project-info";
import { logger } from "./logger.js";
import { DBT_DOCTOR_CONFIG_FILENAME, parseDbtDoctorProps } from "./parse-dbt-doctor-props.js";
import { validateConfigTypes } from "./validate-config-types.js";

interface LoadedDbtDoctorConfig {
  config: DbtDoctorConfig;
  /** Directory containing `.dbt-doctor` (path fields like `rootDir` resolve relative to this). */
  sourceDirectory: string;
}

const loadPropsConfig = (configFilePath: string): DbtDoctorConfig | null => {
  try {
    const fileContent = fs.readFileSync(configFilePath, "utf-8");
    return validateConfigTypes(parseDbtDoctorProps(fileContent));
  } catch (error) {
    logger.warn(
      `Failed to parse ${DBT_DOCTOR_CONFIG_FILENAME}: ${error instanceof Error ? error.message : String(error)}`,
    );
    return null;
  }
};

const loadConfigFromDirectory = (directory: string): LoadedDbtDoctorConfig | null => {
  const propsPath = path.join(directory, DBT_DOCTOR_CONFIG_FILENAME);
  if (!isFile(propsPath)) return null;

  const config = loadPropsConfig(propsPath);
  if (!config) return null;

  return { config, sourceDirectory: directory };
};

const isProjectBoundary = (directory: string): boolean =>
  fs.existsSync(path.join(directory, ".git")) || isMonorepoRoot(directory);

const cachedConfigs = new Map<string, LoadedDbtDoctorConfig | null>();

export const clearConfigCache = (): void => {
  cachedConfigs.clear();
};

export const loadConfigWithSource = (rootDirectory: string): LoadedDbtDoctorConfig | null => {
  const cached = cachedConfigs.get(rootDirectory);
  if (cached !== undefined) return cached;

  const localConfig = loadConfigFromDirectory(rootDirectory);
  if (localConfig) {
    cachedConfigs.set(rootDirectory, localConfig);
    return localConfig;
  }

  if (isProjectBoundary(rootDirectory)) {
    cachedConfigs.set(rootDirectory, null);
    return null;
  }

  let ancestorDirectory = path.dirname(rootDirectory);
  while (ancestorDirectory !== path.dirname(ancestorDirectory)) {
    const ancestorConfig = loadConfigFromDirectory(ancestorDirectory);
    if (ancestorConfig) {
      cachedConfigs.set(rootDirectory, ancestorConfig);
      return ancestorConfig;
    }
    if (isProjectBoundary(ancestorDirectory)) {
      cachedConfigs.set(rootDirectory, null);
      return null;
    }
    ancestorDirectory = path.dirname(ancestorDirectory);
  }

  cachedConfigs.set(rootDirectory, null);
  return null;
};

export { DBT_DOCTOR_CONFIG_FILENAME } from "./parse-dbt-doctor-props.js";
