import type { DbtDoctorConfig, DbtDoctorPreset } from "@dbt-doctor/types";

/**
 * Tag bundles skipped per preset via `ignore.tags`.
 * Rules with any ignored tag are not registered for the scan.
 */
const IGNORE_TAGS = {
  style: ["style", "phase5"],
  strict: ["strict"],
  enterprise: ["enterprise"],
} as const;

const PRESET_OVERRIDES: Record<DbtDoctorPreset, Partial<DbtDoctorConfig>> = {
  /**
   * Recommended starter: core architecture, naming, SQL quality, and manifest rules
   * without documentation-contract (`strict`), governance (`enterprise`), or
   * formatting (`style` / `phase5`) tiers.
   */
  default: {
    ignore: {
      tags: [...IGNORE_TAGS.enterprise, ...IGNORE_TAGS.strict, ...IGNORE_TAGS.style],
    },
  },
  /**
   * CI documentation and contract discipline on top of `default`, still without
   * enterprise governance or SQL style noise.
   */
  strict: {
    failOn: "error",
    ignore: { tags: [...IGNORE_TAGS.enterprise, ...IGNORE_TAGS.style] },
    categories: {
      Documentation: "error",
      Configuration: "error",
      Architecture: "error",
      Testing: "warn",
    },
  },
  /**
   * Full catalog except SQL formatting rules; stricter governance and graph checks.
   */
  enterprise: {
    scoreMode: "files",
    failOn: "warning",
    ignore: { tags: [...IGNORE_TAGS.style] },
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

const mergePresetConfig = (
  preset: DbtDoctorPreset,
  config: DbtDoctorConfig,
): DbtDoctorConfig => {
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
  if (!config.preset) return config;
  return mergePresetConfig(config.preset, config);
};
