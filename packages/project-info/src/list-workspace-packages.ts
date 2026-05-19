import path from "node:path";
import type { WorkspacePackage } from "@dbt-doctor/types";
import { DBT_PROJECT_FILENAME } from "./constants.js";
import { discoverDbtSubprojects } from "./discover-dbt-subprojects.js";
import { isFile } from "./utils/is-file.js";
import { getWorkspacePatterns } from "./get-workspace-patterns.js";
import { readPackageJson } from "./read-package-json.js";
import { resolveWorkspaceDirectories } from "./resolve-workspace-directories.js";

export const listWorkspacePackages = (rootDirectory: string): WorkspacePackage[] => {
  const packageJsonPath = path.join(rootDirectory, "package.json");
  if (!isFile(packageJsonPath)) return discoverDbtSubprojects(rootDirectory);

  const packageJson = readPackageJson(packageJsonPath);
  const patterns = getWorkspacePatterns(rootDirectory, packageJson);
  if (patterns.length === 0) return discoverDbtSubprojects(rootDirectory);

  const packages: WorkspacePackage[] = [];
  const seenDirectories = new Set<string>();

  const addDirectory = (directory: string): void => {
    for (const workspacePackage of discoverDbtSubprojects(directory)) {
      if (seenDirectories.has(workspacePackage.directory)) continue;
      seenDirectories.add(workspacePackage.directory);
      packages.push(workspacePackage);
    }
  };

  if (isFile(path.join(rootDirectory, DBT_PROJECT_FILENAME))) {
    addDirectory(rootDirectory);
  }

  for (const pattern of patterns) {
    for (const workspaceDirectory of resolveWorkspaceDirectories(rootDirectory, pattern)) {
      if (!isFile(path.join(workspaceDirectory, DBT_PROJECT_FILENAME))) continue;
      addDirectory(workspaceDirectory);
    }
  }

  return packages;
};
