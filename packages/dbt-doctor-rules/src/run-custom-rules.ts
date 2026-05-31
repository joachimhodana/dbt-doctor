import fs from "node:fs";
import path from "node:path";
import type { Diagnostic, ProjectInfo } from "@dbt-doctor/types";
import { readManifest } from "@dbt-doctor/manifest";
import {
  DBT_PROJECT_FILENAME,
  SOURCE_FILE_PATTERN,
  YAML_SOURCE_PATTERN,
  isFile,
} from "@dbt-doctor/project-info";
import { ALL_DBT_DOCTOR_RULES } from "./rule-registry.js";
import type { RuleContext } from "./types.js";

const SKIP_DIRS = new Set(["target", "dbt_packages"]);

const walkFiles = (
  directory: string,
  pattern: RegExp,
  rootDirectory: string,
  files: string[],
): void => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!entry.name.startsWith(".") && !SKIP_DIRS.has(entry.name)) {
        walkFiles(fullPath, pattern, rootDirectory, files);
      }
      continue;
    }
    if (entry.isFile() && pattern.test(entry.name)) {
      files.push(path.relative(rootDirectory, fullPath).replace(/\\/g, "/"));
    }
  }
};

const listProjectFiles = (
  rootDirectory: string,
  relativeDirs: string[],
  pattern: RegExp,
): string[] => {
  const files: string[] = [];
  for (const dir of relativeDirs) {
    const absolute = path.join(rootDirectory, dir);
    if (!fs.existsSync(absolute)) continue;
    walkFiles(absolute, pattern, rootDirectory, files);
  }
  return files;
};

export interface RunCustomRulesOptions {
  rootDirectory: string;
  project: ProjectInfo;
  includePaths?: string[];
  manifestPath?: string;
  ruleConfig?: Record<string, Record<string, unknown>>;
  ignoredTags: ReadonlySet<string>;
}

export const runCustomRules = (options: RunCustomRulesOptions): Diagnostic[] => {
  const { rootDirectory, project, includePaths, manifestPath, ignoredTags } = options;
  const allRuleConfig = options.ruleConfig ?? {};

  let sqlFiles = listProjectFiles(rootDirectory, project.modelPaths, SOURCE_FILE_PATTERN);
  const yamlDirs = [
    ...new Set([
      ...project.modelPaths,
      ...project.seedPaths,
      ...project.macroPaths,
      ...project.snapshotPaths,
      "models",
      "seeds",
      "macros",
      "snapshots",
    ]),
  ];
  let yamlFiles = listProjectFiles(rootDirectory, yamlDirs, YAML_SOURCE_PATTERN);
  let macroSqlFiles = listProjectFiles(rootDirectory, project.macroPaths, SOURCE_FILE_PATTERN);
  let testSqlFiles = listProjectFiles(rootDirectory, project.testPaths, SOURCE_FILE_PATTERN);
  let seedDataFiles = listProjectFiles(
    rootDirectory,
    project.seedPaths,
    /\.(csv|tsv|parquet|json)$/i,
  );

  if (includePaths && includePaths.length > 0) {
    const allowed = new Set(includePaths.map((p) => p.replace(/\\/g, "/")));
    sqlFiles = sqlFiles.filter((f) => allowed.has(f));
    yamlFiles = yamlFiles.filter((f) => allowed.has(f));
    testSqlFiles = testSqlFiles.filter((f) => allowed.has(f));
  }

  if (isFile(path.join(rootDirectory, DBT_PROJECT_FILENAME))) {
    yamlFiles.push("dbt_project.yml");
  }
  const packagesYml = path.join(rootDirectory, "packages.yml");
  if (isFile(packagesYml)) {
    yamlFiles.push("packages.yml");
  }

  const context: RuleContext = {
    rootDirectory,
    project,
    sqlFiles,
    yamlFiles: [...new Set(yamlFiles)],
    macroSqlFiles,
    testSqlFiles,
    seedDataFiles,
    readFile: (relativePath) => {
      try {
        return fs.readFileSync(path.join(rootDirectory, relativePath), "utf-8");
      } catch {
        return "";
      }
    },
    fileExists: (relativePath) => isFile(path.join(rootDirectory, relativePath)),
    manifest: readManifest(rootDirectory, manifestPath) ?? undefined,
    ruleConfig: {},
  };

  const diagnostics: Diagnostic[] = [];
  for (const rule of ALL_DBT_DOCTOR_RULES) {
    if (rule.tags?.some((tag) => ignoredTags.has(tag))) continue;
    if (rule.requiresManifest && !context.manifest) {
      continue;
    }
    if (
      rule.requiresAdapter &&
      rule.requiresAdapter.length > 0 &&
      project.adapter !== "unknown" &&
      !rule.requiresAdapter.includes(project.adapter)
    ) {
      continue;
    }
    diagnostics.push(...rule.run({ ...context, ruleConfig: allRuleConfig[rule.id] ?? {} }));
  }
  return diagnostics;
};
