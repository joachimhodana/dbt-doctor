import type { DbtDoctorConfig, InspectResult, PerModelScore } from "@dbt-doctor/types";

const hasProjectThresholdFailure = (
  result: InspectResult,
  failProjectUnder: number | undefined,
): boolean => {
  if (typeof failProjectUnder !== "number") return false;
  const score = result.score?.score;
  if (typeof score !== "number") return false;
  return score < failProjectUnder;
};

const hasAnyItemThresholdFailure = (
  result: InspectResult,
  failAnyItemUnder: number | undefined,
): boolean => {
  if (typeof failAnyItemUnder !== "number") return false;
  const perModelScores: PerModelScore[] = result.perModelScores ?? [];
  return perModelScores.some((entry) => entry.score < failAnyItemUnder);
};

export const shouldFailForScoreThresholds = (
  results: InspectResult[],
  userConfig: DbtDoctorConfig | null,
): boolean => {
  const failProjectUnder = userConfig?.failProjectUnder;
  const failAnyItemUnder = userConfig?.failAnyItemUnder;
  if (typeof failProjectUnder !== "number" && typeof failAnyItemUnder !== "number") return false;

  return results.some(
    (result) =>
      hasProjectThresholdFailure(result, failProjectUnder) ||
      hasAnyItemThresholdFailure(result, failAnyItemUnder),
  );
};
