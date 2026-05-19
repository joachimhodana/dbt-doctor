import { DEFAULT_SCORE_MODE, FETCH_TIMEOUT_MS, SCORE_API_URL } from "./constants.js";
import { calculateScoreLocal } from "./calculate-score-local.js";
import type { CalculateScoreLocalOptions } from "./calculate-score-local.js";
import type { Diagnostic, ScoreMode, ScoreResult } from "@dbt-doctor/types";

const parseScoreResult = (value: unknown): ScoreResult | null => {
  if (typeof value !== "object" || value === null) return null;
  if (!("score" in value) || !("label" in value)) return null;
  const scoreValue = Reflect.get(value, "score");
  const labelValue = Reflect.get(value, "label");
  if (typeof scoreValue !== "number" || typeof labelValue !== "string") return null;
  return { score: scoreValue, label: labelValue };
};

const buildScoreApiPayload = (
  diagnostics: Diagnostic[],
  scoreMode: ScoreMode,
  totalFilesScanned: number | undefined,
): string =>
  JSON.stringify({
    diagnostics: diagnostics.map(
      ({ filePath, plugin, rule, severity, message, help, line, column, category }) => ({
        filePath,
        plugin,
        rule,
        severity,
        message,
        help,
        line,
        column,
        category,
      }),
    ),
    scoreMode,
    totalFilesScanned,
  });

const isAbortError = (error: unknown): boolean =>
  error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError");

const describeFailure = (error: unknown): string => {
  if (isAbortError(error)) return `timed out after ${FETCH_TIMEOUT_MS / 1000}s`;
  if (error instanceof Error && error.message) return error.message;
  return String(error);
};

export interface CalculateScoreOptions extends CalculateScoreLocalOptions {
  offline?: boolean;
}

export const calculateScore = async (
  diagnostics: Diagnostic[],
  options: CalculateScoreOptions = {},
): Promise<ScoreResult | null> => {
  const scoreMode = options.scoreMode ?? DEFAULT_SCORE_MODE;
  const localOptions: CalculateScoreLocalOptions = {
    scoreMode,
    totalFilesScanned: options.totalFilesScanned,
  };
  if (options.offline) {
    return calculateScoreLocal(diagnostics, localOptions);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(SCORE_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: buildScoreApiPayload(diagnostics, scoreMode, options.totalFilesScanned),
      signal: controller.signal,
    });

    if (!response.ok) {
      return calculateScoreLocal(diagnostics, localOptions);
    }

    const remote = parseScoreResult(await response.json());
    return remote ?? calculateScoreLocal(diagnostics, localOptions);
  } catch (error) {
    console.warn(
      `[dbt-doctor] Score API unreachable (${describeFailure(error)}), using local score`,
    );
    return calculateScoreLocal(diagnostics, localOptions);
  } finally {
    clearTimeout(timeoutId);
  }
};

export { calculateScoreLocal } from "./calculate-score-local.js";
