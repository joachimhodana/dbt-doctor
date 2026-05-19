import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { calculateScore } from "@dbt-doctor/core";
import type { Diagnostic } from "@dbt-doctor/types";

const sampleDiagnostics: Diagnostic[] = [
  {
    filePath: "models/a.sql",
    plugin: "dbt-doctor",
    rule: "example-rule",
    severity: "error",
    message: "Example",
    help: "",
    line: 1,
    column: 1,
    category: "SQL Quality",
  },
];

const stubFetch = (impl: typeof fetch): void => {
  vi.stubGlobal("fetch", vi.fn(impl));
};

describe("calculateScore", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("falls back to local score when fetch throws", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    stubFetch(async () => {
      throw new Error("network unavailable");
    });

    const result = await calculateScore(sampleDiagnostics);

    expect(result).not.toBeNull();
    expect(result?.score).toBeLessThan(100);
  });

  it("uses local score in offline mode", async () => {
    const result = await calculateScore(sampleDiagnostics, { offline: true });
    expect(result?.score).toBeLessThan(100);
    expect(result?.label).toBeDefined();
  });
});
