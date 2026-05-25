import type { DbtDoctorConfig, DbtDoctorPreset } from "@dbt-doctor/types";

/**
 * Tag bundles skipped per preset via `ignore.tags`.
 * Rules with any ignored tag are not registered for the scan.
 */
const IGNORE_TAGS = {
  style: ["style", "sql-style"],
  strict: ["strict"],
  enterprise: ["enterprise"],
} as const;

const PRESET_OVERRIDES: Record<DbtDoctorPreset, Partial<DbtDoctorConfig>> = {
  /**
   * Recommended starter: core architecture, naming, SQL quality, and manifest rules
   * without documentation-contract (`strict`), governance (`enterprise`), or
   * formatting (`style` / `sql-style`) tiers.
   */
  default: {
    ignore: {
      tags: [...IGNORE_TAGS.enterprise, ...IGNORE_TAGS.strict, ...IGNORE_TAGS.style],
    },
  },
  /**
   * CI documentation, native SQL style, and contract discipline on top of `default`,
   * without enterprise governance rules.
   */
  strict: {
    failOn: "error",
    ignore: { tags: [...IGNORE_TAGS.enterprise] },
    categories: {
      Documentation: "error",
      Configuration: "error",
      Architecture: "error",
      "SQL Style": "warn",
      Testing: "warn",
    },
  },
  /**
   * Full rule catalog (122 rules) with stricter governance and graph checks.
   */
  enterprise: {
    scoreMode: "files",
    failOn: "warning",
    categories: {
      Governance: "error",
      Architecture: "error",
      Sources: "error",
      Documentation: "warn",
      Performance: "warn",
      Testing: "warn",
    },
  },
};

const mergePresetConfig = (preset: DbtDoctorPreset, config: DbtDoctorConfig): DbtDoctorConfig => {
  const presetDefaults = PRESET_OVERRIDES[preset];
  return {
    ...presetDefaults,
    ...config,
    preset,
    ignore: { ...presetDefaults.ignore, ...config.ignore },
    categories: { ...presetDefaults.categories, ...config.categories },
    surfaces: { ...presetDefaults.surfaces, ...config.surfaces },
    rules: { ...presetDefaults.rules, ...config.rules },
  };
};

export const applyConfigPreset = (config: DbtDoctorConfig | null): DbtDoctorConfig | null => {
  if (!config) return null;
  const preset: DbtDoctorPreset = config.preset ?? "default";
  return mergePresetConfig(preset, config);
};
