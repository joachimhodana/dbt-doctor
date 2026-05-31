import { Command } from "commander";
import { CANONICAL_GITHUB_URL, highlighter } from "@dbt-doctor/core";
import { inspectAction } from "./commands/inspect.js";
import { installAction } from "./commands/install.js";
import { exitGracefully } from "./utils/exit-gracefully.js";
import { handleError } from "./utils/handle-error.js";
import { isJsonModeActive, writeJsonErrorReport } from "./utils/json-mode.js";
import { VERSION } from "./utils/version.js";

process.on("SIGINT", exitGracefully);
process.on("SIGTERM", exitGracefully);

const program = new Command()
  .name("dbt-doctor")
  .description("Diagnose dbt project health (SQL, YAML, Jinja)")
  .version(VERSION, "-v, --version", "display the version number")
  .argument("[directory]", "project directory to scan", ".")
  .option("--lint", "enable linting")
  .option("--no-lint", "skip linting")
  .option("--verbose", "show every rule and per-file details (default shows top 3 rules)")
  .option("--score", "output only the score")
  .option("--coverage", "print model test/docs coverage summary")
  .option("--show-per-model-scores", "print local score for each model (worst first)")
  .option(
    "--use-sqlfluff",
    "DEPRECATED: use SQLFluff subprocess linting as fallback (will be removed in a future release)",
  )
  .option("--json", "output a single structured JSON report (suppresses other output)")
  .option("--json-compact", "with --json, emit compact JSON (no indentation)")
  .option("-y, --yes", "skip prompts, scan all workspace projects")
  .option("--full", "force a full scan (overrides any `diff` value in config or `--diff`)")
  .option("--project <name>", "select workspace project (comma-separated for multiple)")
  .option(
    "--manifest <path>",
    "path to dbt manifest JSON (default: target/manifest.json); enables manifest graph rules",
  )
  .option(
    "--diff [base]",
    "scan only files changed vs base branch (pass `false` to disable; overridden by --full)",
  )
  .option("--offline", "skip the score API and the share URL (no score is shown)")
  .option("--staged", "scan only staged (git index) files for pre-commit hooks")
  .option(
    "--fail-on <level>",
    "exit with error code on diagnostics: error, warning, none (default: error)",
  )
  .option("--preset <name>", "config preset: default, strict, enterprise (overrides .dbt-doctor)")
  .option(
    "--score-mode <mode>",
    "score formula: files (default) or unique-rules (overrides .dbt-doctor)",
  )
  .option("--annotations", "output diagnostics as GitHub Actions annotations")
  .option("--sarif", "output diagnostics as SARIF 2.1 JSON (for GitHub Code Scanning and similar)")
  .option(
    "--pr-comment",
    "tune CLI output for sticky PR comments (drops weak-signal rule families like `design` from the printed list and the fail-on gate; configure via config.surfaces)",
  )
  .option(
    "--explain <file:line>",
    "diagnose why a rule fired or why a suppression didn't apply at a specific location",
  )
  .option("--why <file:line>", "alias for --explain")
  .option(
    "--respect-inline-disables",
    "respect inline `// eslint-disable*` / `// oxlint-disable*` comments (default)",
  )
  .option(
    "--no-respect-inline-disables",
    "audit mode: neutralize inline lint suppressions before scanning",
  )
  .addHelpText(
    "after",
    `
${highlighter.dim("Configuration:")}
  Place a ${highlighter.info(".dbt-doctor")} props file (KEY=value, # comments) in the project root.
  CLI flags override config. See the README for all options.

${highlighter.dim("Learn more:")}
  ${highlighter.info(CANONICAL_GITHUB_URL)}
`,
  );

program.action(inspectAction);

program
  .command("install")
  .alias("setup")
  .description("Install the dbt-doctor skill into your coding agents")
  .option("-y, --yes", "skip prompts, install for all detected agents")
  .option("--dry-run", "show what would be installed without writing files")
  .option("-c, --cwd <cwd>", "working directory", process.cwd())
  .action(installAction);

// HACK: when stdout is piped into a process that closes early (e.g.
// `dbt-doctor . | head`), Node throws an uncaught EPIPE on the next
// write. Exit cleanly instead of dumping a stack trace.
process.stdout.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EPIPE") process.exit(0);
});

program.parseAsync().catch((error: unknown) => {
  if (isJsonModeActive()) {
    writeJsonErrorReport(error);
    process.exit(1);
  }
  handleError(error);
});
