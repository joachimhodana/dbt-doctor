import type { Rule } from "../types.js";
import { checkLayerPrefix } from "../utils/prefix.js";

export const stagingPrefix: Rule = {
  id: "staging-prefix",
  severity: "warn",
  category: "Naming",
  recommendation: "Use stg_ prefix for staging models",
  run: ({ sqlFiles }) =>
    checkLayerPrefix(stagingPrefix, sqlFiles, ["/staging/", "/stg/"], "stg_", "Staging"),
};
