import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const DEFAULT_DBT_PROJECT = [
  "name: fp_fixture",
  'version: "1"',
  "profile: default",
  'model-paths: ["models"]',
  'seed-paths: ["seeds"]',
].join("\n");

export interface TempDbtProjectInput {
  modelSql: string;
  modelPath?: string;
  extraFiles?: Record<string, string>;
}

export interface TempDbtProject {
  directory: string;
  cleanup: () => void;
}

export const writeProjectFile = (rootDir: string, relativePath: string, body: string): void => {
  const filePath = path.join(rootDir, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, body);
};

export const createTempDbtProject = (input: TempDbtProjectInput): TempDbtProject => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-fp-"));
  writeProjectFile(directory, "dbt_project.yml", DEFAULT_DBT_PROJECT);
  writeProjectFile(directory, input.modelPath ?? "models/staging/stg_fixture.sql", input.modelSql);

  for (const [relativePath, body] of Object.entries(input.extraFiles ?? {})) {
    writeProjectFile(directory, relativePath, body);
  }

  return {
    directory,
    cleanup: () => fs.rmSync(directory, { recursive: true, force: true }),
  };
};
