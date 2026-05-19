import type { DbtDoctorConfig, DbtDoctorPreset, FailOnLevel, ScoreMode } from "@dbt-doctor/types";

export const DBT_DOCTOR_CONFIG_FILENAME = ".dbt-doctor";

const VALID_PRESETS = new Set<DbtDoctorPreset>(["default", "strict", "enterprise"]);

const VALID_SCORE_MODES = new Set<ScoreMode>(["unique-rules", "files"]);

const VALID_FAIL_ON = new Set<FailOnLevel>(["error", "warning", "none"]);

const VALID_SEVERITIES = new Set(["error", "warn", "off"]);

const BOOLEAN_TRUE = new Set(["true", "1", "yes", "on"]);
const BOOLEAN_FALSE = new Set(["false", "0", "no", "off"]);

const toCamelCase = (segment: string): string =>
  segment.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());

const splitList = (value: string): string[] =>
  value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

const parseBoolean = (value: string): boolean | undefined => {
  const normalized = value.trim().toLowerCase();
  if (BOOLEAN_TRUE.has(normalized)) return true;
  if (BOOLEAN_FALSE.has(normalized)) return false;
  return undefined;
};

const setIgnoreList = (
  config: DbtDoctorConfig,
  field: "rules" | "files" | "tags",
  entries: string[],
): void => {
  config.ignore ??= {};
  config.ignore[field] = entries;
};

const setSurfaceList = (
  config: DbtDoctorConfig,
  surface: string,
  field: string,
  entries: string[],
): void => {
  config.surfaces ??= {};
  const surfaceKey = surface as keyof NonNullable<DbtDoctorConfig["surfaces"]>;
  const controls = config.surfaces[surfaceKey] ?? {};
  Reflect.set(controls, field, entries);
  config.surfaces[surfaceKey] = controls;
};

const applyScalar = (config: DbtDoctorConfig, key: string, rawValue: string): void => {
  const value = rawValue.trim();
  if (value.length === 0) return;

  switch (key) {
    case "preset": {
      const preset = value as DbtDoctorPreset;
      if (VALID_PRESETS.has(preset)) config.preset = preset;
      return;
    }
    case "scoreMode":
    case "score_mode": {
      const scoreMode = value as ScoreMode;
      if (VALID_SCORE_MODES.has(scoreMode)) config.scoreMode = scoreMode;
      return;
    }
    case "failOn":
    case "fail_on": {
      const failOn = value as FailOnLevel;
      if (VALID_FAIL_ON.has(failOn)) config.failOn = failOn;
      return;
    }
    case "rootDir":
    case "root_dir":
      config.rootDir = value;
      return;
    case "baseline": {
      const boolValue = parseBoolean(value);
      config.baseline = boolValue ?? value;
      return;
    }
    case "lint":
    case "verbose":
    case "customRulesOnly":
    case "custom_rules_only":
    case "share":
    case "offline":
    case "skipSqlfluff":
    case "skip_sqlfluff":
    case "respectInlineDisables":
    case "respect_inline_disables":
    case "adoptExistingSqlfluffConfig":
    case "adopt_existing_sqlfluff_config":
    case "adoptExistingLintConfig":
    case "adopt_existing_lint_config": {
      const boolValue = parseBoolean(value);
      if (boolValue === undefined) return;
      const camelKey = toCamelCase(key) as keyof DbtDoctorConfig;
      Reflect.set(config, camelKey, boolValue);
      return;
    }
    case "diff": {
      const boolValue = parseBoolean(value);
      config.diff = boolValue ?? value;
      return;
    }
    default:
      return;
  }
};

const applyDottedKey = (config: DbtDoctorConfig, dottedKey: string, rawValue: string): void => {
  const value = rawValue.trim();
  if (value.length === 0) return;

  const segments = dottedKey.split(".").map(toCamelCase);

  if (segments[0] === "ignore" && segments.length === 2) {
    const field = segments[1];
    if (field === "rules" || field === "files" || field === "tags") {
      setIgnoreList(config, field, splitList(value));
    }
    return;
  }

  if (segments[0] === "rules" && segments.length === 2) {
    const severity = value as "error" | "warn" | "off";
    if (!VALID_SEVERITIES.has(severity)) return;
    config.rules ??= {};
    config.rules[segments[1]!] = severity;
    return;
  }

  if (segments[0] === "categories" && segments.length === 2) {
    const severity = value as "error" | "warn" | "off";
    if (!VALID_SEVERITIES.has(severity)) return;
    config.categories ??= {};
    config.categories[segments[1]!] = severity;
    return;
  }

  if (segments[0] === "surfaces" && segments.length === 3) {
    const surface = segments[1]!;
    const field = segments[2]!;
    if (
      field === "includeTags" ||
      field === "excludeTags" ||
      field === "includeCategories" ||
      field === "excludeCategories" ||
      field === "includeRules" ||
      field === "excludeRules"
    ) {
      setSurfaceList(config, surface, field, splitList(value));
    }
  }
};

/**
 * Parses a `.dbt-doctor` props file (`KEY=value`, `#` comments, dotted keys).
 */
export const parseDbtDoctorProps = (content: string): DbtDoctorConfig => {
  const config: DbtDoctorConfig = {};

  for (const line of content.split(/\r?\n/u)) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith("#")) continue;

    const withoutComment = trimmed.split("#")[0]?.trim() ?? "";
    if (withoutComment.length === 0) continue;

    const separatorIndex = withoutComment.indexOf("=");
    if (separatorIndex <= 0) continue;

    const rawKey = withoutComment.slice(0, separatorIndex).trim();
    const rawValue = withoutComment.slice(separatorIndex + 1).trim();
    const key = toCamelCase(rawKey);

    if (key.includes(".")) {
      applyDottedKey(config, key, rawValue);
    } else {
      applyScalar(config, key, rawValue);
    }
  }

  return config;
};
