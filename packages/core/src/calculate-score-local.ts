import {
  DEFAULT_SCORE_MODE,
  MAX_FILE_RATIO_PENALTY,
  PERFECT_SCORE,
  SCORE_ERROR_RULE_PENALTY,
  SCORE_FINDINGS_PER_PENALTY_POINT,
  SCORE_VOLUME_PENALTY_CAP,
  SCORE_WARNING_RULE_PENALTY,
} from "./constants.js";
import type { Diagnostic, ScoreMode, ScoreResult } from "@dbt-doctor/types";
import { getScoreLabel } from "./get-score-label.js";

export interface CalculateScoreLocalOptions {
  scoreMode?: ScoreMode;
  totalFilesScanned?: number;
}

const uniqueRulePenalty = (diagnostics: Diagnostic[]): number => {
  const errorRules = new Set<string>();
  const warningRules = new Set<string>();
  for (const diagnostic of diagnostics) {
    const ruleKey = `${diagnostic.plugin}/${diagnostic.rule}`;
    if (diagnostic.severity === "error") {
      errorRules.add(ruleKey);
    } else {
      warningRules.add(ruleKey);
    }
  }
  return (
    errorRules.size * SCORE_ERROR_RULE_PENALTY + warningRules.size * SCORE_WARNING_RULE_PENALTY
  );
};

const fileRatioPenalty = (
  diagnostics: Diagnostic[],
  totalFilesScanned: number | undefined,
): number => {
  const affectedFiles = new Set(diagnostics.map((diagnostic) => diagnostic.filePath)).size;
  const total = Math.max(totalFilesScanned ?? affectedFiles, 1);
  return Math.round((affectedFiles / total) * MAX_FILE_RATIO_PENALTY);
};

const volumePenalty = (diagnosticCount: number): number =>
  Math.min(
    SCORE_VOLUME_PENALTY_CAP,
    Math.floor(diagnosticCount / SCORE_FINDINGS_PER_PENALTY_POINT),
  );

export const calculateScoreLocal = (
  diagnostics: Diagnostic[],
  options: CalculateScoreLocalOptions = {},
): ScoreResult => {
  if (diagnostics.length === 0) {
    return { score: PERFECT_SCORE, label: getScoreLabel(PERFECT_SCORE) };
  }

  const scoreMode = options.scoreMode ?? DEFAULT_SCORE_MODE;
  const rulePenalty = uniqueRulePenalty(diagnostics);
  const filesPenalty =
    scoreMode === "files" ? fileRatioPenalty(diagnostics, options.totalFilesScanned) : 0;
  const findingsPenalty = volumePenalty(diagnostics.length);

  const score = Math.max(
    0,
    Math.round(PERFECT_SCORE - rulePenalty - filesPenalty - findingsPenalty),
  );
  return { score, label: getScoreLabel(score) };
};
