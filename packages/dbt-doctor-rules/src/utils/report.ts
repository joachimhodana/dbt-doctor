import type { Diagnostic } from "@dbt-doctor/types";
import type { Rule } from "../types.js";

export const report = (
  rule: Rule,
  filePath: string,
  message: string,
  help: string,
): Diagnostic => ({
  filePath,
  plugin: "dbt-doctor",
  rule: rule.id,
  severity: rule.severity === "error" ? "error" : "warning",
  message,
  help,
  line: 1,
  column: 1,
  category: rule.category,
});
