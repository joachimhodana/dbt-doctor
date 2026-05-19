import type { InspectOptions, DbtDoctorConfig } from "@dbt-doctor/types";
import type { InspectFlags } from "./inspect-flags.js";
import { isCiEnvironment } from "./is-ci-environment.js";

export const resolveCliInspectOptions = (
  flags: InspectFlags,
  userConfig: DbtDoctorConfig | null,
): InspectOptions => ({
  lint: flags.lint ?? userConfig?.lint ?? true,
  verbose: flags.verbose ?? userConfig?.verbose ?? false,
  scoreOnly: Boolean(flags.score),
  offline: Boolean(flags.offline) || (userConfig?.offline ?? false) || isCiEnvironment(),
  silent: Boolean(flags.json) || Boolean(flags.sarif),
  respectInlineDisables: flags.respectInlineDisables ?? userConfig?.respectInlineDisables ?? true,
  outputSurface: flags.prComment ? "prComment" : "cli",
});
