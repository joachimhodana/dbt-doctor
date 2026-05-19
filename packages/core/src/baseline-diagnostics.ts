import fs from "node:fs";
import path from "node:path";
import type { Diagnostic } from "@dbt-doctor/types";

export const DEFAULT_BASELINE_FILENAME = ".dbt-doctor-baseline.json";

export const diagnosticFingerprint = (diagnostic: Diagnostic): string =>
  `${diagnostic.plugin}/${diagnostic.rule}@${diagnostic.filePath}:${diagnostic.line}`;

export const resolveBaselinePath = (
  rootDirectory: string,
  baseline: boolean | string | undefined,
): string | null => {
  if (baseline === undefined || baseline === false) return null;
  if (typeof baseline === "string") {
    return path.isAbsolute(baseline) ? baseline : path.join(rootDirectory, baseline);
  }
  return path.join(rootDirectory, DEFAULT_BASELINE_FILENAME);
};

export const loadBaselineFingerprints = (baselinePath: string): Set<string> => {
  try {
    const { fingerprints } = JSON.parse(fs.readFileSync(baselinePath, "utf-8")) as {
      fingerprints?: unknown;
    };
    if (!Array.isArray(fingerprints)) return new Set();
    return new Set(fingerprints.filter((entry): entry is string => typeof entry === "string"));
  } catch {
    return new Set();
  }
};

export const filterBaselineDiagnostics = (
  diagnostics: Diagnostic[],
  baselinePath: string | null,
): Diagnostic[] => {
  if (!baselinePath) return diagnostics;
  const known = loadBaselineFingerprints(baselinePath);
  if (known.size === 0) return diagnostics;
  return diagnostics.filter((diagnostic) => !known.has(diagnosticFingerprint(diagnostic)));
};

export const writeBaselineFile = (baselinePath: string, diagnostics: Diagnostic[]): void => {
  const payload = {
    version: 1 as const,
    fingerprints: [...new Set(diagnostics.map(diagnosticFingerprint))].sort(),
  };
  fs.writeFileSync(baselinePath, `${JSON.stringify(payload, null, 2)}\n`, "utf-8");
};
