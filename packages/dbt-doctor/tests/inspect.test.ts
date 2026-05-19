import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { DEFAULT_BASELINE_FILENAME } from "@dbt-doctor/core";
import { inspect } from "../src/inspect.js";

const fixture = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures/basic-dbt");
const opts = { silent: true, offline: true, configOverride: { customRulesOnly: true } as const };

describe("inspect", () => {
  let tmp: string;

  afterEach(() => {
    if (tmp) fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("writeBaseline then filters on next run", async () => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-inspect-"));
    fs.cpSync(fixture, tmp, { recursive: true });
    const cfg = { customRulesOnly: true, baseline: true } as const;
    const before = await inspect(tmp, { ...opts, configOverride: cfg });
    await inspect(tmp, { ...opts, configOverride: cfg, writeBaseline: true });
    expect(fs.existsSync(path.join(tmp, DEFAULT_BASELINE_FILENAME))).toBe(true);
    const after = await inspect(tmp, { ...opts, configOverride: cfg });
    expect(after.diagnostics.length).toBeLessThan(before.diagnostics.length);
  });
});
