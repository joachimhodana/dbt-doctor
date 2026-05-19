import type { Diagnostic, ProjectInfo } from "@dbt-doctor/types";

export type RuleSeverity = "error" | "warn";

export interface RuleContext {
  rootDirectory: string;
  project: ProjectInfo;
  sqlFiles: string[];
  yamlFiles: string[];
  readFile: (relativePath: string) => string;
}

export interface Rule {
  id: string;
  severity: RuleSeverity;
  category: string;
  tags?: readonly string[];
  recommendation?: string;
  requiresAdapter?: readonly string[];
  run: (context: RuleContext) => Diagnostic[];
}

export interface DbtDoctorPlugin {
  rules: Record<string, Rule>;
}
