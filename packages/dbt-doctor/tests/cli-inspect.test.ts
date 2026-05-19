import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vite-plus/test";
import { validateModeFlags } from "../src/cli/utils/validate-mode-flags.js";

const root = path.dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const cli = path.join(root, "dist/cli.js");
const fixture = path.join(root, "tests/fixtures/basic-dbt");

describe("CLI inspect", () => {
  it("rejects --sarif with --json", () => {
    expect(() => validateModeFlags({ sarif: true, json: true })).toThrow(
      /--sarif cannot be combined/,
    );
  });

  it("--sarif prints SARIF JSON", () => {
    const result = spawnSync(
      process.execPath,
      [cli, fixture, "--sarif", "--offline", "-y", "--fail-on", "none"],
      {
        encoding: "utf-8",
        env: { ...process.env, CI: "1" },
      },
    );
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout).version).toBe("2.1.0");
  });
});
