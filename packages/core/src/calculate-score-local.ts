import { PERFECT_SCORE } from "./constants.js";
import type { Diagnostic, ScoreResult } from "@dbt-doctor/types";
import { getScoreLabel } from "./get-score-label.js";

const ERROR_RULE_PENALTY = 1.5;
const WARNING_RULE_PENALTY = 0.75;

export const calculateScoreLocal = (diagnostics: Diagnostic[]): ScoreResult => {
  if (diagnostics.length === 0) {
    return { score: PERFECT_SCORE, label: getScoreLabel(PERFECT_SCORE) };
  }

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

  const penalty = errorRules.size * ERROR_RULE_PENALTY + warningRules.size * WARNING_RULE_PENALTY;
  const score = Math.max(0, Math.round(PERFECT_SCORE - penalty));

  return { score, label: getScoreLabel(score) };
};
