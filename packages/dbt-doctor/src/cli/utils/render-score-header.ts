import {
  CANONICAL_GITHUB_URL,
  PERFECT_SCORE,
  SCORE_BAR_WIDTH_CHARS,
  SCORE_GOOD_THRESHOLD,
  SCORE_OK_THRESHOLD,
  SITE_HOST,
} from "@dbt-doctor/core";
import type { ScoreResult } from "@dbt-doctor/types";
import { colorizeByScore } from "./colorize-by-score.js";
import { highlighter, logger } from "@dbt-doctor/core";

interface ScoreBarSegments {
  filledSegment: string;
  emptySegment: string;
}

const buildScoreBarSegments = (score: number): ScoreBarSegments => {
  const filledCount = Math.round((score / PERFECT_SCORE) * SCORE_BAR_WIDTH_CHARS);
  const emptyCount = SCORE_BAR_WIDTH_CHARS - filledCount;

  return {
    filledSegment: colorizeByScore(score)("█".repeat(filledCount)),
    emptySegment: highlighter.dim("░".repeat(emptyCount)),
  };
};

const buildScoreLabel = (score: number): string => {
  if (score >= SCORE_GOOD_THRESHOLD) return "Great";
  if (score >= SCORE_OK_THRESHOLD) return "Needs work";
  return "Critical";
};

const BRANDING_LINE = `dbt Doctor ${highlighter.dim(`(${SITE_HOST})`)}`;

export const printScoreHeader = (scoreResult: ScoreResult): void => {
  const { score } = scoreResult;
  const label = scoreResult.label || buildScoreLabel(score);
  const { filledSegment, emptySegment } = buildScoreBarSegments(score);

  logger.log(`  ${BRANDING_LINE}`);
  logger.log(`  Score: ${colorizeByScore(score)(`${score}`)} ${highlighter.dim(`(${label})`)}`);
  logger.log(`  ${filledSegment}${emptySegment}`);
  logger.break();
};

export const printBrandingOnlyHeader = (): void => {
  logger.log(`  ${BRANDING_LINE}`);
  logger.break();
};

export const printNoScoreHeader = (noScoreMessage: string): void => {
  logger.log(`  ${BRANDING_LINE}`);
  logger.log(`  ${highlighter.gray(noScoreMessage)}`);
  logger.break();
};

export const printGithubActionCta = (): void => {
  logger.log(
    `  ${highlighter.bold("→ Run in CI:")} ${highlighter.info("joachimhodana/dbt-doctor")} GitHub Action`,
  );
  logger.log(`  ${highlighter.dim(`See ${CANONICAL_GITHUB_URL} for setup.`)}`);
  logger.break();
};
