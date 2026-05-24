import { performance } from "node:perf_hooks";
import {
  applyConfigPreset,
  calculateScore,
  combineDiagnostics,
  computeSqlIncludePaths,
  filterBaselineDiagnostics,
  filterDiagnosticsForSurface,
  formatErrorChain,
  highlighter,
  isLoggerSilent,
  loadConfigWithSource,
  logger,
  resolveBaselinePath,
  resolveConfigRootDir,
  resolveLintIncludePaths,
  runLinter,
  setLoggerSilent,
  writeBaselineFile,
} from "@dbt-doctor/core";
import { discoverProject } from "@dbt-doctor/project-info";
import type {
  Diagnostic,
  DiagnosticSurface,
  InspectOptions,
  InspectResult,
  DbtDoctorConfig,
} from "@dbt-doctor/types";
import { printDiagnostics } from "./cli/utils/render-diagnostics.js";
import { printProjectDetection } from "./cli/utils/render-project-detection.js";
import {
  printBrandingOnlyHeader,
  printNoScoreHeader,
  printScoreHeader,
} from "./cli/utils/render-score-header.js";
import { printSummary } from "./cli/utils/render-summary.js";
import { printCoverageSummary, printPerModelScores } from "./cli/utils/render-phase4.js";
import { isSpinnerSilent, setSpinnerSilent, spinner } from "./cli/utils/spinner.js";
import { computeCoverageMetrics, computePerModelScores } from "./phase4-metrics.js";

interface ResolvedInspectOptions {
  lint: boolean;
  verbose: boolean;
  scoreOnly: boolean;
  offline: boolean;
  silent: boolean;
  includePaths: string[];
  manifestPath?: string;
  customRulesOnly: boolean;
  share: boolean;
  respectInlineDisables: boolean;
  adoptExistingLintConfig: boolean;
  useSqlfluff: boolean;
  ignoredTags: ReadonlySet<string>;
  outputSurface: DiagnosticSurface;
  writeBaseline: boolean;
  coverage: boolean;
  showPerModelScores: boolean;
}

const buildIgnoredTags = (userConfig: DbtDoctorConfig | null): ReadonlySet<string> => {
  const tags = new Set<string>();
  if (userConfig?.ignore?.tags) {
    for (const tag of userConfig.ignore.tags) tags.add(tag);
  }
  return tags;
};

const mergeInspectOptions = (
  inputOptions: InspectOptions,
  userConfig: DbtDoctorConfig | null,
): ResolvedInspectOptions => ({
  lint: inputOptions.lint ?? userConfig?.lint ?? true,
  verbose: inputOptions.verbose ?? userConfig?.verbose ?? false,
  scoreOnly: inputOptions.scoreOnly ?? false,
  offline: inputOptions.offline ?? false,
  silent: inputOptions.silent ?? false,
  includePaths: inputOptions.includePaths ?? [],
  manifestPath: inputOptions.manifestPath ?? userConfig?.manifestPath,
  customRulesOnly: userConfig?.customRulesOnly ?? false,
  share: userConfig?.share ?? true,
  respectInlineDisables:
    inputOptions.respectInlineDisables ?? userConfig?.respectInlineDisables ?? true,
  adoptExistingLintConfig:
    userConfig?.adoptExistingSqlfluffConfig ?? userConfig?.adoptExistingLintConfig ?? true,
  useSqlfluff:
    inputOptions.useSqlfluff ??
    userConfig?.useSqlfluff ??
    (typeof userConfig?.skipSqlfluff === "boolean" ? !userConfig.skipSqlfluff : false),
  ignoredTags: buildIgnoredTags(userConfig),
  outputSurface: inputOptions.outputSurface ?? "cli",
  writeBaseline: inputOptions.writeBaseline ?? false,
  coverage: inputOptions.coverage ?? false,
  showPerModelScores: inputOptions.showPerModelScores ?? false,
});

export const inspect = async (
  directory: string,
  inputOptions: InspectOptions = {},
): Promise<InspectResult> => {
  const startTime = performance.now();

  let scanDirectory = directory;
  let userConfig: DbtDoctorConfig | null;
  if (inputOptions.configOverride !== undefined) {
    userConfig = inputOptions.configOverride;
  } else {
    const loadedConfig = loadConfigWithSource(directory);
    const redirectedDirectory = resolveConfigRootDir(
      loadedConfig?.config ?? null,
      loadedConfig?.sourceDirectory ?? null,
    );
    if (redirectedDirectory) scanDirectory = redirectedDirectory;
    userConfig = applyConfigPreset(loadedConfig?.config ?? null);
  }

  const options = mergeInspectOptions(inputOptions, userConfig);

  const wasLoggerSilent = isLoggerSilent();
  const wasSpinnerSilent = isSpinnerSilent();
  if (options.silent) {
    setLoggerSilent(true);
    setSpinnerSilent(true);
  }

  try {
    return await runInspect(scanDirectory, options, userConfig, startTime);
  } finally {
    if (options.silent) {
      setLoggerSilent(wasLoggerSilent);
      setSpinnerSilent(wasSpinnerSilent);
    }
  }
};

const runInspect = async (
  directory: string,
  options: ResolvedInspectOptions,
  userConfig: DbtDoctorConfig | null,
  startTime: number,
): Promise<InspectResult> => {
  const projectInfo = discoverProject(directory);
  const { includePaths } = options;
  const isDiffMode = includePaths.length > 0;

  const sqlIncludePaths = computeSqlIncludePaths(includePaths);
  const lintIncludePaths = sqlIncludePaths ?? resolveLintIncludePaths(directory, userConfig);
  const lintSourceFileCount = lintIncludePaths?.length ?? projectInfo.sourceFileCount;

  if (!options.scoreOnly) {
    printProjectDetection(projectInfo, userConfig, isDiffMode, includePaths, lintSourceFileCount);
  }

  let didLintFail = false;
  let lintFailureReason: string | null = null;
  const lintPartialFailures: string[] = [];

  const lintPromise = options.lint
    ? (async () => {
        const lintSpinner = options.scoreOnly ? null : spinner("Running dbt checks...").start();
        try {
          const lintDiagnostics = await runLinter({
            rootDirectory: directory,
            project: projectInfo,
            includePaths: lintIncludePaths,
            manifestPath: options.manifestPath,
            ruleConfig: userConfig?.ruleConfig,
            adoptExistingSqlfluffConfig: options.adoptExistingLintConfig,
            useSqlfluff: options.useSqlfluff && !options.customRulesOnly,
            ignoredTags: options.ignoredTags,
          });
          lintSpinner?.succeed("Running dbt checks.");
          return lintDiagnostics;
        } catch (error) {
          didLintFail = true;
          const lintErrorChain = formatErrorChain(error);
          lintFailureReason = lintErrorChain;
          if (!options.scoreOnly) {
            lintSpinner?.fail("Lint checks failed (non-fatal, skipping).");
            logger.error(lintErrorChain);
          }
          return [];
        }
      })()
    : Promise.resolve<Diagnostic[]>([]);

  const lintDiagnostics = await lintPromise;
  const combinedDiagnostics = combineDiagnostics({
    lintDiagnostics,
    directory,
    isDiffMode,
    userConfig,
    respectInlineDisables: options.respectInlineDisables,
  });
  const baselinePath = resolveBaselinePath(directory, userConfig?.baseline);
  if (options.writeBaseline && baselinePath) {
    writeBaselineFile(baselinePath, combinedDiagnostics);
  }
  const diagnostics = filterBaselineDiagnostics(combinedDiagnostics, baselinePath);

  const elapsedMilliseconds = performance.now() - startTime;

  const skippedChecks: string[] = [];
  if (didLintFail) skippedChecks.push("lint");
  const hasSkippedChecks = skippedChecks.length > 0;

  // HACK: --offline opts out of the score API entirely; without a
  // local fallback (intentional — scoring lives on the server) we
  // simply skip the score in offline mode and the renderer shows the
  // "score unavailable" branch. The message distinguishes the two
  // null sources — `--offline` (user-requested) vs API failure (the
  // network round-trip didn't return a usable score) — so the
  // renderer doesn't claim offline mode when the user is online but
  // the API was unreachable.
  //
  // Pre-filter diagnostics through the `score` surface so weak-signal
  // rule families (e.g. `design`) stay out of scoring by default and
  // don't dilute the headline number. Surface-included diagnostics
  // still flow through `result.diagnostics` for CLI/JSON consumers.
  const scoreDiagnostics = filterDiagnosticsForSurface(diagnostics, "score", userConfig);
  const scoreResult = await calculateScore(scoreDiagnostics, {
    offline: options.offline,
    scoreMode: userConfig?.scoreMode,
    totalFilesScanned: lintSourceFileCount,
  });
  const noScoreMessage = options.offline
    ? "Score unavailable in offline mode."
    : "Score unavailable (could not reach the score API).";

  const skippedCheckReasons: Record<string, string> = {};
  if (didLintFail && lintFailureReason !== null) {
    skippedCheckReasons.lint = lintFailureReason;
  } else if (lintPartialFailures.length > 0) {
    // Lint as a whole succeeded (we got diagnostics from at least one
    // batch) but some batches timed out — surface the partial-failure
    // notes so JSON consumers see why a few files weren't checked.
    skippedCheckReasons["lint:partial"] = lintPartialFailures.join("; ");
  }

  const coverageMetrics = options.coverage
    ? computeCoverageMetrics(directory, projectInfo)
    : undefined;
  const shouldComputePerModelScores =
    options.showPerModelScores ||
    typeof userConfig?.failAnyItemUnder === "number" ||
    typeof userConfig?.failProjectUnder === "number";
  const perModelScores = shouldComputePerModelScores
    ? computePerModelScores(diagnostics, directory, projectInfo, userConfig?.scoreMode)
    : undefined;

  const buildResult = (): InspectResult => ({
    diagnostics,
    score: scoreResult,
    ...(coverageMetrics ? { coverage: coverageMetrics } : {}),
    ...(perModelScores ? { perModelScores } : {}),
    skippedChecks,
    ...(Object.keys(skippedCheckReasons).length > 0 ? { skippedCheckReasons } : {}),
    project: projectInfo,
    elapsedMilliseconds,
  });

  if (options.scoreOnly) {
    if (scoreResult) {
      logger.log(`${scoreResult.score}`);
    } else {
      logger.dim(noScoreMessage);
    }
    return buildResult();
  }

  // `outputSurface` strips weak-signal rule families (default: `design`
  // tag) from the printed list when capturing output destined for a PR
  // comment, so style cleanup can't dilute meaningful React findings.
  // The full diagnostic list is still returned via `buildResult()` so
  // JSON consumers and the score path see everything. The filter always
  // runs (even for the `cli` surface, which ships with no default
  // exclusions) so user-configured `surfaces.cli.exclude*` overrides
  // are honored on the printed output too.
  const surfaceDiagnostics = filterDiagnosticsForSurface(
    diagnostics,
    options.outputSurface,
    userConfig,
  );
  const demotedDiagnosticCount = diagnostics.length - surfaceDiagnostics.length;

  if (surfaceDiagnostics.length === 0) {
    if (hasSkippedChecks) {
      const skippedLabel = skippedChecks.join(" and ");
      logger.warn(
        `No issues detected, but ${skippedLabel} checks failed — results are incomplete.`,
      );
    } else if (demotedDiagnosticCount > 0) {
      logger.success(
        `No issues found! (${demotedDiagnosticCount} demoted from the ${options.outputSurface} surface — see config.surfaces.)`,
      );
    } else {
      logger.success("No issues found!");
    }
    logger.break();
    if (hasSkippedChecks) {
      printBrandingOnlyHeader();
      logger.log(highlighter.gray("  Score not shown — some checks could not complete."));
    } else if (scoreResult) {
      printScoreHeader(scoreResult);
    } else {
      printNoScoreHeader(noScoreMessage);
    }
    return buildResult();
  }

  logger.break();
  printDiagnostics(surfaceDiagnostics, options.verbose, directory);

  if (demotedDiagnosticCount > 0) {
    logger.log(
      highlighter.gray(
        `  ${demotedDiagnosticCount} demoted from the ${options.outputSurface} surface (e.g. design cleanup) — run \`npx dbt-doctor@latest .\` locally for the full list.`,
      ),
    );
    logger.break();
  }

  const displayedSourceFileCount = isDiffMode ? includePaths.length : lintSourceFileCount;

  const shouldShowShareLink = !options.offline && options.share;
  printSummary(
    surfaceDiagnostics,
    elapsedMilliseconds,
    scoreResult,
    projectInfo.projectName,
    displayedSourceFileCount,
    noScoreMessage,
    !shouldShowShareLink,
  );
  if (coverageMetrics) {
    printCoverageSummary(coverageMetrics);
  }
  if (options.showPerModelScores && perModelScores) {
    logger.break();
    printPerModelScores(perModelScores, directory);
  }

  if (hasSkippedChecks) {
    const skippedLabel = skippedChecks.join(" and ");
    logger.break();
    logger.warn(`  Note: ${skippedLabel} checks failed — score may be incomplete.`);
  }

  return buildResult();
};
