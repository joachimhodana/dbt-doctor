import type { ProjectInfo } from "@dbt-doctor/types";

/** dbt models run in the warehouse — no client-side public env prefix like Next/Vite. */
export const buildNoSecretsRecommendation = (
  _project: ProjectInfo,
  fallbackRecommendation: string,
): string => fallbackRecommendation;
