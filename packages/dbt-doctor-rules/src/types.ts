import type { Diagnostic, ProjectInfo } from "@dbt-doctor/types";
import type { ManifestGraph } from "@dbt-doctor/manifest";

export type RuleSeverity = "error" | "warn";

export interface RuleContext {
  rootDirectory: string;
  project: ProjectInfo;
  sqlFiles: string[];
  yamlFiles: string[];
  macroSqlFiles: string[];
  testSqlFiles: string[];
  seedDataFiles: string[];
  readFile: (relativePath: string) => string;
  fileExists: (relativePath: string) => boolean;
  manifest?: ManifestGraph;
  ruleConfig: Record<string, unknown>;
}

export interface Rule {
  id: string;
  severity: RuleSeverity;
  category: string;
  tags?: readonly string[];
  recommendation?: string;
  requiresAdapter?: readonly string[];
  requiresManifest?: boolean;
  run: (context: RuleContext) => Diagnostic[];
}

export interface DbtDoctorPlugin {
  rules: Record<string, Rule>;
}
