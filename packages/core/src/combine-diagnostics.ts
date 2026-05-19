import type { Diagnostic, DbtDoctorConfig } from "@dbt-doctor/types";
import { createNodeReadFileLinesSync } from "./read-file-lines-node.js";
import { mergeAndFilterDiagnostics } from "./merge-and-filter-diagnostics.js";

interface CombineDiagnosticsInput {
  lintDiagnostics: Diagnostic[];
  directory: string;
  isDiffMode: boolean;
  userConfig: DbtDoctorConfig | null;
  readFileLinesSync?: (filePath: string) => string[] | null;
  respectInlineDisables?: boolean;
}

export const combineDiagnostics = (input: CombineDiagnosticsInput): Diagnostic[] =>
  mergeAndFilterDiagnostics(
    input.lintDiagnostics,
    input.directory,
    input.userConfig,
    input.readFileLinesSync ?? createNodeReadFileLinesSync(input.directory),
    {
      respectInlineDisables: input.respectInlineDisables,
    },
  );
