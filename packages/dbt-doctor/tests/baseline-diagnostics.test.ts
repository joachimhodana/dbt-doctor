import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vite-plus/test";
import {
  DEFAULT_BASELINE_FILENAME,
  diagnosticFingerprint,
  filterBaselineDiagnostics,
  resolveBaselinePath,
  writeBaselineFile,
} from "@dbt-doctor/core";
import type { Diagnostic } from "@dbt-doctor/types";

const sampleDiagnostic = (overrides: Partial<Diagnostic> = {}): Diagnostic => ({
  filePath: "models/marts/fct_orders.sql",
  plugin: "dbt-doctor",
  rule: "no-select-star",
  severity: "warning",
  message: "Avoid SELECT *",
  help: "List columns explicitly",
  line: 12,
  column: 1,
  category: "SQL",
  ...overrides,
});

describe("baseline diagnostics", () => {
  let tempDirectory: string;

  afterEach(() => {
    if (tempDirectory) fs.rmSync(tempDirectory, { recursive: true, force: true });
  });

  it("resolves default and custom baseline paths", () => {
    tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-baseline-"));
    expect(resolveBaselinePath(tempDirectory, undefined)).toBeNull();
    expect(resolveBaselinePath(tempDirectory, false)).toBeNull();
    expect(resolveBaselinePath(tempDirectory, true)).toBe(
      path.join(tempDirectory, DEFAULT_BASELINE_FILENAME),
    );
    expect(resolveBaselinePath(tempDirectory, "baselines/known.json")).toBe(
      path.join(tempDirectory, "baselines/known.json"),
    );
  });

  it("filters diagnostics matching baseline fingerprints", () => {
    tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-baseline-"));
    const baselinePath = path.join(tempDirectory, DEFAULT_BASELINE_FILENAME);
    const known = sampleDiagnostic();
    const unknown = sampleDiagnostic({ rule: "model-has-tests", line: 3 });
    writeBaselineFile(baselinePath, [known]);

    const filtered = filterBaselineDiagnostics([known, unknown], baselinePath);
    expect(filtered).toEqual([unknown]);
  });

  it("dedupes fingerprints when writing baseline", () => {
    tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-baseline-"));
    const baselinePath = path.join(tempDirectory, DEFAULT_BASELINE_FILENAME);
    const diagnostic = sampleDiagnostic();
    writeBaselineFile(baselinePath, [diagnostic, diagnostic]);

    const payload = JSON.parse(fs.readFileSync(baselinePath, "utf-8")) as {
      version: number;
      fingerprints: string[];
    };
    expect(payload.version).toBe(1);
    expect(payload.fingerprints).toEqual([diagnosticFingerprint(diagnostic)]);
  });
});
