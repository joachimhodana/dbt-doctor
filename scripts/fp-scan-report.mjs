#!/usr/bin/env node
/**
 * Scan a dbt project and print a rule histogram (useful for FP triage on real repos).
 *
 * Usage:
 *   pnpm fp-scan /path/to/dbt-project
 *   pnpm fp-scan /path/to/dbt-project --preset enterprise
 *   pnpm fp-scan /path/to/dbt-project --rules sql-no-comma-join,root-models
 *
 * Requires a built CLI: run `pnpm build` first.
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const cliPath = resolve(repoRoot, "packages/dbt-doctor/dist/cli.js");

const args = process.argv.slice(2);
const presetIndex = args.indexOf("--preset");
const rulesIndex = args.indexOf("--rules");
const preset = presetIndex >= 0 ? args[presetIndex + 1] : undefined;
const rulesFilter =
  rulesIndex >= 0
    ? args[rulesIndex + 1]
        ?.split(",")
        .map((rule) => rule.trim())
        .filter(Boolean)
    : undefined;

const positional = args.filter(
  (arg, index) =>
    arg !== "--preset" &&
    arg !== "--rules" &&
    (presetIndex < 0 || index !== presetIndex + 1) &&
    (rulesIndex < 0 || index !== rulesIndex + 1),
);
const projectPath = resolve(positional[0] ?? ".");

if (!existsSync(cliPath)) {
  console.error("CLI not built. Run: pnpm build");
  process.exit(1);
}

const cliArgs = [cliPath, projectPath, "--json", "--yes"];
if (preset) cliArgs.push("--preset", preset);

const result = spawnSync(process.execPath, cliArgs, {
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

const stdout = result.stdout?.trim();
if (!stdout) {
  console.error(result.stderr || "No JSON output from dbt-doctor");
  process.exit(result.status ?? 1);
}

const report = JSON.parse(stdout);
const diagnostics = (report.diagnostics ?? []).filter((diagnostic) =>
  rulesFilter ? rulesFilter.includes(diagnostic.rule) : true,
);

const byRule = new Map();
for (const diagnostic of diagnostics) {
  byRule.set(diagnostic.rule, (byRule.get(diagnostic.rule) ?? 0) + 1);
}

console.log(`dbt-doctor fp-scan`);
console.log(`  project: ${projectPath}`);
console.log(`  preset:  ${preset ?? "(default / config)"}`);
console.log(`  score:   ${report.score?.score ?? report.score ?? "n/a"}`);
console.log(`  findings:${diagnostics.length} (${byRule.size} rules)`);
console.log("");

const sorted = [...byRule.entries()].sort((left, right) => right[1] - left[1]);
for (const [rule, count] of sorted) {
  console.log(`${String(count).padStart(5)}  ${rule}`);
}

if (sorted.length === 0) {
  console.log("(no findings)");
}

process.exit(result.status ?? 0);
