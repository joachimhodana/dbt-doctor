import fs from "node:fs";
import path from "node:path";
import { isFile } from "./utils/is-file.js";

export interface DbtProjectYaml {
  name?: string;
  profile?: string;
  modelPaths?: string[];
  macroPaths?: string[];
  testPaths?: string[];
  seedPaths?: string[];
  snapshotPaths?: string[];
  analysisPaths?: string[];
}

const readScalar = (block: string, key: string): string | undefined => {
  const match = block.match(new RegExp(`^${key}:\\s*["']?([^"'\\n#]+)`, "m"));
  return match?.[1]?.trim();
};

const readPathList = (block: string, key: string): string[] | undefined => {
  const lines = block.split("\n");
  const start = lines.findIndex((line) => line.match(new RegExp(`^${key}:\\s*$`)));
  if (start === -1) {
    const inline = readScalar(block, key);
    if (inline) return [inline.replace(/^\[|\]$/g, "").trim()].filter(Boolean);
    return undefined;
  }
  const paths: string[] = [];
  for (let index = start + 1; index < lines.length; index++) {
    const line = lines[index];
    if (!line.startsWith("  ") && line.trim() !== "") break;
    const item = line.match(/^\s+-\s+["']?([^"'\n]+)/);
    if (item?.[1]) paths.push(item[1].trim());
  }
  return paths.length > 0 ? paths : undefined;
};

/** Lightweight YAML reader for dbt_project.yml keys we need (no full YAML parser). */
export const parseDbtProjectYaml = (content: string): DbtProjectYaml => ({
  name: readScalar(content, "name"),
  profile: readScalar(content, "profile"),
  modelPaths: readPathList(content, "model-paths") ?? readPathList(content, "model_paths"),
  macroPaths: readPathList(content, "macro-paths") ?? readPathList(content, "macro_paths"),
  testPaths: readPathList(content, "test-paths") ?? readPathList(content, "test_paths"),
  seedPaths: readPathList(content, "seed-paths") ?? readPathList(content, "seed_paths"),
  snapshotPaths: readPathList(content, "snapshot-paths") ?? readPathList(content, "snapshot_paths"),
  analysisPaths: readPathList(content, "analysis-paths") ?? readPathList(content, "analysis_paths"),
});

export const readDbtProjectYaml = (directory: string): DbtProjectYaml | null => {
  const filePath = path.join(directory, "dbt_project.yml");
  if (!isFile(filePath)) return null;
  try {
    return parseDbtProjectYaml(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
};

export const findDbtProjectRoot = (startDirectory: string): string | null => {
  let current = path.resolve(startDirectory);
  for (;;) {
    if (isFile(path.join(current, "dbt_project.yml"))) return current;
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
};
