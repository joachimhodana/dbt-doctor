import dbtDoctorPlugin from "dbt-doctor-rules";
import type { Diagnostic, DbtDoctorConfig } from "@dbt-doctor/types";
import { applySeverityControls } from "./apply-severity-controls.js";
import { filterIgnoredDiagnostics, filterInlineSuppressions } from "./filter-diagnostics.js";
import { isTestFilePath } from "./is-test-file.js";

interface MergeAndFilterOptions {
  respectInlineDisables?: boolean;
}

const testFileResultCache = new Map<string, boolean>();

export const clearAutoSuppressionCaches = (): void => {
  testFileResultCache.clear();
};

const shouldAutoSuppress = (diagnostic: Diagnostic): boolean => {
  const filePath = diagnostic.filePath;

  const rule = diagnostic.plugin === "dbt-doctor" ? dbtDoctorPlugin.rules[diagnostic.rule] : null;
  if (rule?.tags?.includes("test-noise")) {
    let isTest = testFileResultCache.get(filePath);
    if (isTest === undefined) {
      isTest = isTestFilePath(filePath);
      testFileResultCache.set(filePath, isTest);
    }
    if (isTest) return true;
  }

  return false;
};

export const mergeAndFilterDiagnostics = (
  mergedDiagnostics: Diagnostic[],
  directory: string,
  userConfig: DbtDoctorConfig | null,
  readFileLinesSync: (filePath: string) => string[] | null,
  options: MergeAndFilterOptions = {},
): Diagnostic[] => {
  const autoFiltered = mergedDiagnostics.filter((diagnostic) => !shouldAutoSuppress(diagnostic));
  const severityAdjusted = applySeverityControls(autoFiltered, userConfig);
  const filtered = userConfig
    ? filterIgnoredDiagnostics(severityAdjusted, userConfig, directory, readFileLinesSync)
    : severityAdjusted;
  if (options.respectInlineDisables === false) return filtered;
  return filterInlineSuppressions(filtered, directory, readFileLinesSync);
};
