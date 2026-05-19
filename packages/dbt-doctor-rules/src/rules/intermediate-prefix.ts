import type { Rule } from "../types.js";
import { checkLayerPrefix } from "../utils/prefix.js";

export const intermediatePrefix: Rule = {
  id: "intermediate-prefix",
  severity: "warn",
  category: "Naming",
  recommendation: "Use int_ prefix for intermediate models",
  run: ({ sqlFiles }) =>
    checkLayerPrefix(
      intermediatePrefix,
      sqlFiles,
      ["/intermediate/", "/int/"],
      "int_",
      "Intermediate",
    ),
};
