import fs from "node:fs";
import path from "node:path";
import type { DbtAdapter, ProjectInfo } from "@dbt-doctor/types";
import { countSourceFiles } from "./count-source-files.js";
import { detectAdapterFromProfile } from "./detect-adapter.js";
import { DbtProjectNotFoundError } from "./errors.js";
import { findDbtProjectRoot, readDbtProjectYaml } from "./read-dbt-project-yaml.js";
import { isFile } from "./utils/is-file.js";

export { listWorkspacePackages } from "./list-workspace-packages.js";

const cachedProjectInfos = new Map<string, ProjectInfo>();

export const clearProjectCache = (): void => {
  cachedProjectInfos.clear();
};

const readPackagesYml = (rootDirectory: string): string | null => {
  const packagesPath = path.join(rootDirectory, "packages.yml");
  if (!isFile(packagesPath)) return null;
  try {
    return fs.readFileSync(packagesPath, "utf-8");
  } catch {
    return null;
  }
};

const readDbtVersionHint = (rootDirectory: string): string | null => {
  for (const filename of ["requirements.txt", "pyproject.toml", "package.yml"]) {
    const filePath = path.join(rootDirectory, filename);
    if (!isFile(filePath)) continue;
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const match = content.match(/dbt-(?:core|snowflake|bigquery|postgres|redshift|duckdb)[^=\s]*[=<>!~]*\s*([0-9][^\s,;]*)/i)
        ?? content.match(/dbt-core[^0-9]*([0-9]+\.[0-9]+(?:\.[0-9]+)?)/i);
      if (match?.[1]) return match[1].replace(/^[=<>!~]+/, "").trim();
    } catch {
      continue;
    }
  }
  return null;
};

const defaultPaths = (value: string[] | undefined, fallback: string): string[] =>
  value && value.length > 0 ? value : [fallback];

export const discoverProject = (directory: string): ProjectInfo => {
  const resolved = path.resolve(directory);
  const cached = cachedProjectInfos.get(resolved);
  if (cached !== undefined) return cached;

  const rootDirectory = findDbtProjectRoot(resolved);
  if (!rootDirectory) {
    throw new DbtProjectNotFoundError(resolved);
  }

  const yaml = readDbtProjectYaml(rootDirectory);
  if (!yaml) {
    throw new DbtProjectNotFoundError(resolved);
  }

  const profileName = yaml.profile ?? null;
  const adapter: DbtAdapter = detectAdapterFromProfile(profileName, readPackagesYml(rootDirectory));
  const projectName = yaml.name ?? path.basename(rootDirectory);

  const info: ProjectInfo = {
    rootDirectory,
    projectName,
    dbtVersion: readDbtVersionHint(rootDirectory),
    adapter,
    profileName,
    modelPaths: defaultPaths(yaml.modelPaths, "models"),
    macroPaths: defaultPaths(yaml.macroPaths, "macros"),
    testPaths: defaultPaths(yaml.testPaths, "tests"),
    seedPaths: defaultPaths(yaml.seedPaths, "seeds"),
    snapshotPaths: defaultPaths(yaml.snapshotPaths, "snapshots"),
    analysisPaths: defaultPaths(yaml.analysisPaths, "analyses"),
    sourceFileCount: countSourceFiles(rootDirectory),
  };

  cachedProjectInfos.set(resolved, info);
  return info;
};

export { discoverDbtSubprojects } from "./discover-dbt-subprojects.js";

/** @deprecated Use discoverDbtSubprojects */
export { discoverDbtSubprojects as discoverReactSubprojects } from "./discover-dbt-subprojects.js";

export const formatFrameworkName = (adapter: DbtAdapter): string =>
  adapter === "unknown" ? "dbt" : `dbt (${adapter})`;
