import { highlighter, logger, toRelativePath } from "@dbt-doctor/core";
import type { CoverageMetrics, PerModelScore } from "@dbt-doctor/types";

export const printCoverageSummary = (coverage: CoverageMetrics): void => {
  logger.log(
    `  ${highlighter.bold("Coverage")}: tests ${coverage.testedPercent}% (${coverage.testedModels}/${coverage.totalModels}) • docs ${coverage.documentedPercent}% (${coverage.documentedModels}/${coverage.totalModels})`,
  );
};

export const printPerModelScores = (scores: PerModelScore[], rootDirectory: string): void => {
  if (scores.length === 0) {
    logger.log(`  ${highlighter.dim("No models found for per-model scoring.")}`);
    return;
  }

  logger.log(highlighter.bold("Per-model scores (worst first)"));
  const limit = Math.min(20, scores.length);
  for (const entry of scores.slice(0, limit)) {
    const rel = toRelativePath(entry.filePath, rootDirectory);
    logger.log(
      `  ${entry.score.toFixed(1).padStart(4)}  ${entry.modelName}  ${highlighter.dim(`(${entry.diagnosticCount} issues, ${entry.label})`)}  ${highlighter.dim(rel)}`,
    );
  }
  if (scores.length > limit) {
    logger.log(highlighter.dim(`  ... ${scores.length - limit} more models`));
  }
};
