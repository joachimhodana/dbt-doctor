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
  coverage: Boolean(flags.coverage),
  showPerModelScores: Boolean(flags.showPerModelScores),
  useSqlfluff: Boolean(flags.useSqlfluff) || (userConfig?.useSqlfluff ?? false),
  offline: Boolean(flags.offline) || (userConfig?.offline ?? false) || isCiEnvironment(),
  silent: Boolean(flags.json) || Boolean(flags.sarif),
  manifestPath: flags.manifest ?? userConfig?.manifestPath,
  respectInlineDisables: flags.respectInlineDisables ?? userConfig?.respectInlineDisables ?? true,
  outputSurface: flags.prComment ? "prComment" : "cli",
});
