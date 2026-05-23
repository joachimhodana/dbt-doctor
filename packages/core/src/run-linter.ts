import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { SOURCE_FILE_PATTERN } from "@dbt-doctor/project-info";
import { runCustomRules } from "dbt-doctor-rules";
import type { Diagnostic, DbtDoctorConfig, ProjectInfo } from "@dbt-doctor/types";
import { batchIncludePaths } from "./batch-include-paths.js";
import { dedupeDiagnostics } from "./utils/dedupe-diagnostics.js";
import { listSourceFiles } from "./utils/list-source-files.js";

const SQLFLUFF_BATCH_SIZE = 50;

export interface RunLinterOptions {
  rootDirectory: string;
  project: ProjectInfo;
  includePaths?: string[];
  manifestPath?: string;
  ruleConfig?: Record<string, Record<string, unknown>>;
  ignoredTags: ReadonlySet<string>;
  adoptExistingSqlfluffConfig?: boolean;
  useSqlfluff?: boolean;
  /** @deprecated Use useSqlfluff */
  skipSqlfluff?: boolean;
}

interface SqlfluffViolation {
  line_no?: number;
  line_pos?: number;
  code?: string;
  description?: string;
  name?: string;
  warning?: boolean;
}

interface SqlfluffFileResult {
  filepath?: string;
  violations?: SqlfluffViolation[];
}

const runSqlfluffBatch = (rootDirectory: string, absolutePaths: string[]): Promise<Diagnostic[]> =>
  new Promise((resolve) => {
    if (absolutePaths.length === 0) {
      resolve([]);
      return;
    }

    const child = spawn(
      "sqlfluff",
      ["lint", ...absolutePaths, "--format", "json", "--disable-progress-bar"],
      { cwd: rootDirectory, env: process.env },
    );

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on("close", (code) => {
      if (code !== 0 && !stdout.trim()) {
        if (stderr.includes("command not found") || stderr.includes("No such file")) {
          console.warn(
            "[dbt-doctor] sqlfluff not found. Install with: pip install sqlfluff sqlfluff-templater-dbt",
          );
        }
        resolve([]);
        return;
      }

      try {
        const parsed: unknown = JSON.parse(stdout);
        resolve(parseSqlfluffOutput(rootDirectory, parsed));
      } catch {
        resolve([]);
      }
    });

    child.on("error", () => {
      console.warn(
        "[dbt-doctor] sqlfluff not available. Install with: pip install sqlfluff sqlfluff-templater-dbt",
      );
      resolve([]);
    });
  });

const parseSqlfluffOutput = (rootDirectory: string, parsed: unknown): Diagnostic[] => {
  const results: SqlfluffFileResult[] = Array.isArray(parsed)
    ? (parsed as SqlfluffFileResult[])
    : [];

  const diagnostics: Diagnostic[] = [];
  for (const fileResult of results) {
    const filePath = fileResult.filepath
      ? path.relative(rootDirectory, fileResult.filepath).replace(/\\/g, "/")
      : "";
    for (const violation of fileResult.violations ?? []) {
      const rule = violation.code ?? violation.name ?? "sqlfluff";
      diagnostics.push({
        filePath,
        plugin: "sqlfluff",
        rule,
        severity: violation.warning ? "warning" : "error",
        message: violation.description ?? rule,
        help: violation.description ?? "",
        line: violation.line_no ?? 1,
        column: violation.line_pos ?? 1,
        category: "SQL Style",
      });
    }
  }
  return diagnostics;
};

export const isSqlfluffAvailable = (): Promise<boolean> =>
  new Promise((resolve) => {
    const child = spawn("sqlfluff", ["--version"], { env: process.env });
    child.on("error", () => resolve(false));
    child.on("close", (code) => resolve(code === 0));
  });

export const runLinter = async (options: RunLinterOptions): Promise<Diagnostic[]> => {
  const {
    rootDirectory,
    project,
    includePaths,
    manifestPath,
    ruleConfig,
    ignoredTags,
    useSqlfluff,
    skipSqlfluff = false,
  } = options;

  const customDiagnostics = runCustomRules({
    rootDirectory,
    project,
    includePaths,
    manifestPath,
    ruleConfig,
    ignoredTags,
  });

  const shouldRunSqlfluff = typeof useSqlfluff === "boolean" ? useSqlfluff : !skipSqlfluff;
  if (!shouldRunSqlfluff) {
    return dedupeDiagnostics(customDiagnostics);
  }

  let sqlPaths =
    includePaths && includePaths.length > 0
      ? includePaths.filter((p) => SOURCE_FILE_PATTERN.test(p))
      : listSourceFiles(rootDirectory);

  sqlPaths = sqlPaths.filter((p) => SOURCE_FILE_PATTERN.test(p));

  const absolutePaths = sqlPaths.map((relative) => path.join(rootDirectory, relative));
  const batches = batchIncludePaths([], absolutePaths);

  const sqlfluffDiagnostics: Diagnostic[] = [];
  for (const batch of batches) {
    const batchResults = await runSqlfluffBatch(rootDirectory, batch);
    sqlfluffDiagnostics.push(...batchResults);
  }

  return dedupeDiagnostics([...customDiagnostics, ...sqlfluffDiagnostics]);
};
