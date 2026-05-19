import type { DbtDoctorConfig, DbtDoctorPreset, FailOnLevel, ScoreMode } from "@dbt-doctor/types";
import { warnConfigIssue } from "./utils/warn-config-issue.js";

const VALID_PRESETS: ReadonlyArray<DbtDoctorPreset> = ["default", "strict", "enterprise"];
const VALID_SCORE_MODES: ReadonlyArray<ScoreMode> = ["unique-rules", "files"];
const VALID_FAIL_ON: ReadonlyArray<FailOnLevel> = ["error", "warning", "none"];

export interface ConfigCliOverrides {
  preset?: string;
  scoreMode?: string;
  failOn?: string;
}

export const mergeConfigWithCliFlags = (
  config: DbtDoctorConfig | null,
  overrides: ConfigCliOverrides,
): DbtDoctorConfig | null => {
  if (!overrides.preset && !overrides.scoreMode && !overrides.failOn && !config) {
    return config;
  }

  const merged: DbtDoctorConfig = { ...(config ?? {}) };

  if (overrides.preset) {
    if (VALID_PRESETS.includes(overrides.preset as DbtDoctorPreset)) {
      merged.preset = overrides.preset as DbtDoctorPreset;
    } else {
      warnConfigIssue(
        `Invalid --preset "${overrides.preset}" (expected: ${VALID_PRESETS.join(", ")}); ignoring.`,
      );
    }
  }

  if (overrides.scoreMode) {
    if (VALID_SCORE_MODES.includes(overrides.scoreMode as ScoreMode)) {
      merged.scoreMode = overrides.scoreMode as ScoreMode;
    } else {
      warnConfigIssue(
        `Invalid --score-mode "${overrides.scoreMode}" (expected: ${VALID_SCORE_MODES.join(", ")}); ignoring.`,
      );
    }
  }

  if (overrides.failOn) {
    if (VALID_FAIL_ON.includes(overrides.failOn as FailOnLevel)) {
      merged.failOn = overrides.failOn as FailOnLevel;
    } else {
      warnConfigIssue(
        `Invalid --fail-on "${overrides.failOn}" (expected: ${VALID_FAIL_ON.join(", ")}); ignoring.`,
      );
    }
  }

  return merged;
};
