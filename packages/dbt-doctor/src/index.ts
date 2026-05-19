import path from "node:path";
import {
  buildJsonReport,
  buildJsonReportError,
  calculateScore,
  clearAutoSuppressionCaches,
  clearConfigCache,
  clearIgnorePatternsCache,
  combineDiagnostics,
  computeSqlIncludePaths,
  createNodeReadFileLinesSync,
  loadConfigWithSource,
  resolveConfigRootDir,
  resolveDiagnoseTarget,
  resolveLintIncludePaths,
  runLinter,
} from "@dbt-doctor/core";
import {
  clearProjectCache,
  discoverProject,
  DbtProjectNotFoundError,
  ProjectNotFoundError,
} from "@dbt-doctor/project-info";
import type {
  Diagnostic,
  DiagnoseOptions,
  DiagnoseResult,
  DiffInfo,
  JsonReport,
  JsonReportDiffInfo,
  JsonReportError,
  JsonReportMode,
  JsonReportProjectEntry,
  JsonReportSummary,
  ProjectInfo,
  DbtDoctorConfig,
  ScoreResult,
} from "@dbt-doctor/types";

export type {
  Diagnostic,
  DiagnoseOptions,
  DiagnoseResult,
  DiffInfo,
  JsonReport,
  JsonReportDiffInfo,
  JsonReportError,
  JsonReportMode,
  JsonReportProjectEntry,
  JsonReportSummary,
  ProjectInfo,
  DbtDoctorConfig,
  ScoreResult,
};
export { getDiffInfo, filterSourceFiles, summarizeDiagnostics } from "@dbt-doctor/core";
export { buildJsonReport, buildJsonReportError };
export {
  DbtDoctorError,
  ProjectNotFoundError,
  DbtProjectNotFoundError,
  isDbtDoctorError,
} from "@dbt-doctor/project-info";

export const clearCaches = (): void => {
  clearProjectCache();
  clearConfigCache();
  clearIgnorePatternsCache();
  clearAutoSuppressionCaches();
};

interface ToJsonReportOptions {
  version: string;
  directory?: string;
  mode?: JsonReportMode;
}

export const toJsonReport = (result: DiagnoseResult, options: ToJsonReportOptions): JsonReport =>
  buildJsonReport({
    version: options.version,
    directory: options.directory ?? result.project.rootDirectory,
    mode: options.mode ?? "full",
    diff: null,
    scans: [
      {
        directory: result.project.rootDirectory,
        result: {
          diagnostics: result.diagnostics,
          score: result.score,
          skippedChecks: [],
          project: result.project,
          elapsedMilliseconds: result.elapsedMilliseconds,
        },
      },
    ],
    totalElapsedMilliseconds: result.elapsedMilliseconds,
  });

const EMPTY_DIAGNOSTICS: Diagnostic[] = [];

export const diagnose = async (
  directory: string,
  options: DiagnoseOptions = {},
): Promise<DiagnoseResult> => {
  const startTime = globalThis.performance.now();
  const requestedDirectory = path.resolve(directory);

  const initialLoadedConfig = loadConfigWithSource(requestedDirectory);
  const redirectedDirectory = resolveConfigRootDir(
    initialLoadedConfig?.config ?? null,
    initialLoadedConfig?.sourceDirectory ?? null,
  );
  const directoryAfterRedirect = redirectedDirectory ?? requestedDirectory;

  const resolvedDirectory = resolveDiagnoseTarget(directoryAfterRedirect);
  if (!resolvedDirectory) {
    throw new ProjectNotFoundError(directoryAfterRedirect);
  }

  const userConfig =
    initialLoadedConfig?.config ?? loadConfigWithSource(resolvedDirectory)?.config ?? null;
  const includePaths = options.includePaths ?? [];
  const isDiffMode = includePaths.length > 0;
  const projectInfo = discoverProject(resolvedDirectory);

  const lintIncludePaths =
    computeSqlIncludePaths(includePaths) ?? resolveLintIncludePaths(resolvedDirectory, userConfig);
  const readFileLinesSync = createNodeReadFileLinesSync(resolvedDirectory);

  const effectiveLint = options.lint ?? userConfig?.lint ?? true;
  const effectiveRespectInlineDisables =
    options.respectInlineDisables ?? userConfig?.respectInlineDisables ?? true;
  const offline = options.offline ?? userConfig?.offline ?? false;

  const ignoredTags = new Set<string>(userConfig?.ignore?.tags ?? []);

  const lintDiagnostics = effectiveLint
    ? await runLinter({
        rootDirectory: resolvedDirectory,
        project: projectInfo,
        includePaths: lintIncludePaths,
        ignoredTags,
        adoptExistingSqlfluffConfig: userConfig?.adoptExistingSqlfluffConfig ?? true,
        skipSqlfluff: userConfig?.skipSqlfluff ?? false,
      }).catch((error: unknown) => {
        console.error("Lint failed:", error);
        return EMPTY_DIAGNOSTICS;
      })
    : EMPTY_DIAGNOSTICS;

  const diagnostics = combineDiagnostics({
    lintDiagnostics,
    directory: resolvedDirectory,
    isDiffMode,
    userConfig,
    readFileLinesSync,
    respectInlineDisables: effectiveRespectInlineDisables,
  });
  const elapsedMilliseconds = globalThis.performance.now() - startTime;
  const score = await calculateScore(diagnostics, { offline });

  return { diagnostics, score, project: projectInfo, elapsedMilliseconds };
};
