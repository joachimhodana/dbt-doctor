import fs from "node:fs";
import path from "node:path";
import type { WorkspacePackage } from "@dbt-doctor/types";
import { DBT_PROJECT_FILENAME } from "./constants.js";
import { readDbtProjectYaml } from "./read-dbt-project-yaml.js";
import { isFile } from "./utils/is-file.js";

const SKIP_DIRS = new Set([".git", "target", "dbt_packages", "node_modules"]);

const toPackage = (directory: string): WorkspacePackage => {
  const yaml = readDbtProjectYaml(directory);
  return { name: yaml?.name ?? path.basename(directory), directory };
};

const findNestedDbtProjects = (rootDirectory: string, maxDepth: number): WorkspacePackage[] => {
  const found: WorkspacePackage[] = [];

  const walk = (directory: string, depth: number): void => {
    if (depth > maxDepth) return;
    if (isFile(path.join(directory, DBT_PROJECT_FILENAME))) {
      found.push(toPackage(directory));
      return;
    }
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith(".") || SKIP_DIRS.has(entry.name)) {
        continue;
      }
      walk(path.join(directory, entry.name), depth + 1);
    }
  };

  walk(rootDirectory, 0);
  return found;
};

export const discoverDbtSubprojects = (rootDirectory: string): WorkspacePackage[] => {
  if (isFile(path.join(rootDirectory, DBT_PROJECT_FILENAME))) {
    return [toPackage(rootDirectory)];
  }
  return findNestedDbtProjects(rootDirectory, 4);
};
