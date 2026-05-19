import type { DbtDoctorConfig, DbtDoctorPreset } from "@dbt-doctor/types";

const PRESET_OVERRIDES: Record<Exclude<DbtDoctorPreset, "default">, Partial<DbtDoctorConfig>> = {
  strict: {
    failOn: "error",
    ignore: { tags: [] },
  },
  enterprise: {
    scoreMode: "files",
    failOn: "warning",
    ignore: { tags: ["style"] },
    categories: {
      Governance: "error",
      Architecture: "error",
    },
  },
};

export const applyConfigPreset = (config: DbtDoctorConfig | null): DbtDoctorConfig | null => {
  if (!config?.preset || config.preset === "default") return config;
  const presetDefaults = PRESET_OVERRIDES[config.preset];
  return {
    ...presetDefaults,
    ...config,
    ignore: { ...presetDefaults.ignore, ...config.ignore },
    categories: { ...presetDefaults.categories, ...config.categories },
    surfaces: { ...presetDefaults.surfaces, ...config.surfaces },
    rules: { ...presetDefaults.rules, ...config.rules },
  };
};
