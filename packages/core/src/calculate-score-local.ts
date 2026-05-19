import { PERFECT_SCORE } from "./constants.js";
import type { Diagnostic, ScoreMode, ScoreResult } from "@dbt-doctor/types";
import { getScoreLabel } from "./get-score-label.js";

const ERROR_RULE_PENALTY = 1.5;
const WARNING_RULE_PENALTY = 0.75;
const MAX_FILE_RATIO_PENALTY = 40;

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
  return errorRules.size * ERROR_RULE_PENALTY + warningRules.size * WARNING_RULE_PENALTY;
};

export const calculateScoreLocal = (
  diagnostics: Diagnostic[],
  options: CalculateScoreLocalOptions = {},
): ScoreResult => {
  if (diagnostics.length === 0) {
    return { score: PERFECT_SCORE, label: getScoreLabel(PERFECT_SCORE) };
  }

  const rulePenalty = uniqueRulePenalty(diagnostics);
  let filePenalty = 0;
  if (options.scoreMode === "files") {
    const affectedFiles = new Set(diagnostics.map((d) => d.filePath)).size;
    const total = Math.max(options.totalFilesScanned ?? affectedFiles, 1);
    filePenalty = Math.round((affectedFiles / total) * MAX_FILE_RATIO_PENALTY);
  }

  const score = Math.max(0, Math.round(PERFECT_SCORE - rulePenalty - filePenalty));
  return { score, label: getScoreLabel(score) };
};
