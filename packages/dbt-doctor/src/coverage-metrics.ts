import fs from "node:fs";
import path from "node:path";
import { calculateScoreLocal } from "@dbt-doctor/core";
import { SOURCE_FILE_PATTERN, YAML_SOURCE_PATTERN } from "@dbt-doctor/project-info";
import type { Diagnostic, ProjectInfo, ScoreMode } from "@dbt-doctor/types";

export interface CoverageMetrics {
  documentedModels: number;
  totalModels: number;
  documentedPercent: number;
  testedModels: number;
  testedPercent: number;
}

export interface PerModelScore {
  modelName: string;
  filePath: string;
  score: number;
  label: string;
  diagnosticCount: number;
}

const SKIP_DIRS = new Set(["target", "dbt_packages", ".git", "node_modules"]);

const isModelSqlPath = (filePath: string): boolean => /\.(sql|SQL)$/i.test(filePath);
const isUnderModelsYaml = (filePath: string): boolean =>
  /\.(yml|yaml)$/i.test(filePath) && filePath.replace(/\\/g, "/").includes("models/");
const modelBaseName = (filePath: string): string => path.basename(filePath, path.extname(filePath));

const splitNamedYamlBlocks = (
  content: string,
  listKey: string,
): { name: string; block: string }[] => {
  const header = content.match(new RegExp(`^\\s*${listKey}:\\s*\\n`, "m"));
  if (!header || header.index === undefined) return [];
  const tail = content.slice(header.index + header[0].length);
  const itemRegex = /^\s{2}-\s+name:\s+["']?([\w.-]+)/gm;
  const indices: { name: string; index: number }[] = [];
  for (const match of tail.matchAll(itemRegex)) {
    if (match.index !== undefined) indices.push({ name: match[1], index: match.index });
  }
  return indices.map(({ name, index }, i) => {
    const end = i + 1 < indices.length ? indices[i + 1].index : tail.length;
    return { name, block: tail.slice(index, end) };
  });
};

const findModelBlock = (
  modelName: string,
  yamlFiles: string[],
  readFile: (path: string) => string,
): { file: string; block: string } | null => {
  for (const file of yamlFiles) {
    if (!isUnderModelsYaml(file)) continue;
    for (const block of splitNamedYamlBlocks(readFile(file), "models")) {
      if (block.name === modelName) return { file, block: block.block };
    }
  }
  return null;
};

const blockHasDescription = (block: string): boolean =>
  /description:\s*\S/.test(block.split("columns:")[0] ?? block);

const listTestReferenceNames = (modelBlock: string): string[] => {
  const names: string[] = [];
  for (const line of modelBlock.split(/\r?\n/u)) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;

    const listMatch = trimmed.match(/^-\s+([a-zA-Z0-9_.-]+)(\s*:.*)?$/);
    if (listMatch) names.push(listMatch[1].split(".").pop() ?? listMatch[1]);

    const inlineList = trimmed.match(/^tests:\s*\[(.+)\]\s*$/);
    if (inlineList) {
      for (const raw of inlineList[1].split(",")) {
        const candidate = raw.trim().replace(/^['"]|['"]$/g, "");
        names.push(candidate.split(".").pop() ?? candidate);
      }
    }

    const mapMatch = trimmed.match(/^([a-zA-Z0-9_.-]+):\s*(\{.*\})?\s*$/);
    if (mapMatch) names.push(mapMatch[1].split(".").pop() ?? mapMatch[1]);
  }
  return names;
};

const walkFiles = (directory: string, rootDirectory: string, files: string[]): void => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!entry.name.startsWith(".") && !SKIP_DIRS.has(entry.name))
        walkFiles(fullPath, rootDirectory, files);
      continue;
    }
    if (!entry.isFile()) continue;
    const relative = path.relative(rootDirectory, fullPath).replace(/\\/g, "/");
    if (SOURCE_FILE_PATTERN.test(entry.name) || YAML_SOURCE_PATTERN.test(entry.name))
      files.push(relative);
  }
};

const listProjectFiles = (rootDirectory: string, paths: string[]): string[] => {
  const files: string[] = [];
  for (const rel of paths) {
    const abs = path.join(rootDirectory, rel);
    if (!fs.existsSync(abs)) continue;
    walkFiles(abs, rootDirectory, files);
  }
  return files;
};

const readFile = (rootDirectory: string, relativePath: string): string => {
  try {
    return fs.readFileSync(path.join(rootDirectory, relativePath), "utf-8");
  } catch {
    return "";
  }
};

export const computeCoverageMetrics = (
  rootDirectory: string,
  project: ProjectInfo,
): CoverageMetrics => {
  const sqlFiles = listProjectFiles(rootDirectory, project.modelPaths).filter((file) =>
    isModelSqlPath(file),
  );
  const yamlFiles = listProjectFiles(rootDirectory, [
    ...project.modelPaths,
    ...project.seedPaths,
    ...project.macroPaths,
    ...project.snapshotPaths,
    "models",
    "seeds",
    "macros",
    "snapshots",
  ]).filter((file) => /\.(yml|yaml)$/i.test(file));

  let documentedModels = 0;
  let testedModels = 0;

  for (const file of sqlFiles) {
    const modelName = modelBaseName(file);
    const modelBlock = findModelBlock(modelName, yamlFiles, (p) => readFile(rootDirectory, p));
    if (!modelBlock) continue;

    if (blockHasDescription(modelBlock.block)) documentedModels += 1;
    if (listTestReferenceNames(modelBlock.block).length > 0) testedModels += 1;
  }

  const totalModels = sqlFiles.length;
  const asPercent = (value: number): number =>
    totalModels === 0 ? 100 : Math.round((value / totalModels) * 100);

  return {
    documentedModels,
    totalModels,
    documentedPercent: asPercent(documentedModels),
    testedModels,
    testedPercent: asPercent(testedModels),
  };
};

export const computePerModelScores = (
  diagnostics: Diagnostic[],
  rootDirectory: string,
  project: ProjectInfo,
  scoreMode: ScoreMode | undefined,
): PerModelScore[] => {
  const sqlFiles = listProjectFiles(rootDirectory, project.modelPaths).filter((file) =>
    isModelSqlPath(file),
  );

  const scores: PerModelScore[] = sqlFiles.map((filePath) => {
    const modelDiagnostics = diagnostics.filter((diagnostic) => diagnostic.filePath === filePath);
    const score = calculateScoreLocal(modelDiagnostics, {
      scoreMode,
      totalFilesScanned: 1,
    });

    return {
      modelName: modelBaseName(filePath),
      filePath,
      score: score.score,
      label: score.label,
      diagnosticCount: modelDiagnostics.length,
    };
  });

  return scores.sort(
    (a, b) =>
      a.score - b.score ||
      b.diagnosticCount - a.diagnosticCount ||
      a.modelName.localeCompare(b.modelName),
  );
};
