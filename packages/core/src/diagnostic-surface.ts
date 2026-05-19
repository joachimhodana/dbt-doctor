import type { DiagnosticSurface } from "@dbt-doctor/types";

export const DIAGNOSTIC_SURFACES = [
  "cli",
  "prComment",
  "score",
  "ciFailure",
] as const satisfies ReadonlyArray<DiagnosticSurface>;

export const isDiagnosticSurface = (value: unknown): value is DiagnosticSurface =>
  typeof value === "string" && (DIAGNOSTIC_SURFACES as ReadonlyArray<string>).includes(value);

/**
 * Built-in surface exclusions applied before any user config.
 *
 * `design`-tagged rules are weak-signal style cleanup — they still ship
 * to the local CLI so developers see them while editing, but they're
 * removed from PR comments and the CI gate so they can't bury real dbt
 * findings. Score includes `style` rules by default so the headline
 * number matches audit severity. Override per-surface via
 * `config.surfaces.<surface>` to tune visibility.
 */
export const DEFAULT_SURFACE_EXCLUDED_TAGS: Record<DiagnosticSurface, ReadonlyArray<string>> = {
  cli: [],
  prComment: ["design"],
  score: ["design"],
  ciFailure: ["design"],
};
