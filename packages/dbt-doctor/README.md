<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./assets/dbt-doctor-readme-logo-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="./assets/dbt-doctor-readme-logo-light.svg">
  <img alt="dbt Doctor" src="./assets/dbt-doctor-readme-logo-light.svg" width="180" height="40">
</picture>

[![version](https://img.shields.io/npm/v/dbt-doctor?style=flat&colorA=000000&colorB=000000)](https://npmjs.com/package/dbt-doctor)
[![downloads](https://img.shields.io/npm/dt/dbt-doctor.svg?style=flat&colorA=000000&colorB=000000)](https://npmjs.com/package/dbt-doctor)

> [!NOTE]
> **dbt-doctor** is a clone of [**React Doctor**](https://github.com/millionco/react-doctor) by [**Million**](https://million.dev). React Doctor is published under the [**MIT License**](https://github.com/millionco/react-doctor/blob/main/LICENSE); this project clones and adapts its ideas (CLI, scoring, agent tooling) for **dbt** and remains **MIT** as well — see the monorepo [**LICENSE**](https://github.com/joachimhodana/dbt-doctor/blob/main/LICENSE). Thank you to the React Doctor maintainers for the original work.

**dbt Doctor** scans **dbt** projects: model SQL, YAML, and Jinja. It runs **custom dbt rules** plus optional **[SQLFluff](https://docs.sqlfluff.com/)** (when installed) and prints a **0–100 health score** with actionable diagnostics.

### [Site & demo →](https://dbt-doctor.joachimhodana.com)

## Requirements

- **Node.js 22+**
- **dbt layout:** a `dbt_project.yml` at the project root (or use `rootDir` in config for monorepos).
- **SQLFluff (recommended):** `pip install sqlfluff sqlfluff-templater-dbt` — omit if you set `skipSqlfluff: true` or use `customRulesOnly` (custom rules only).

## Quick start

From your dbt project root:

```bash
npx dbt-doctor@latest
```

You get a **score** (75+ **Great**, 50–74 **Needs work**, under 50 **Critical**) and grouped findings. The score counts **unique rules** that fired (each `plugin/rule` once), not every occurrence.

## Install for coding agents

Install the **dbt-doctor** skill into detected agents (Cursor, Claude Code, Codex, and others):

```bash
npx dbt-doctor@latest install
```

Use `--yes` to skip prompts. Same behavior as the website’s `curl` installer, which delegates to this command.

## GitHub Actions

A **composite action** lives in this repo. Example workflow:

```yaml
name: dbt Doctor

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read
  pull-requests: write # for sticky PR comments

jobs:
  dbt-doctor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
        with:
          fetch-depth: 0 # required when using diff
      - uses: joachimhodana/dbt-doctor@main
        with:
          diff: main
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

**Notable inputs:** `directory`, `verbose`, `project`, `diff`, `github-token`, `fail-on` (`error` / `warning` / `none`), `offline`, `annotations`, `setup-sqlfluff` (default installs SQLFluff + dbt templater), `node-version`. See [`action.yml`](https://github.com/joachimhodana/dbt-doctor/blob/main/action.yml) for full descriptions.

With `github-token` on `pull_request`, findings are posted as a **sticky PR comment**. The action exposes a **`score`** output (0–100) for follow-up steps (e.g. score floor checks).

**Bare CLI in CI** (no marketplace action):

```yaml
- run: npx dbt-doctor@latest --fail-on warning
```

Remember to install SQLFluff in that job unless you rely on `skipSqlfluff` / `customRulesOnly`.

## PR blocking and exit codes

- **`--fail-on <level>`** — `error` (default), `warning`, or `none`. Applies to diagnostics that pass the **`ciFailure`** surface (see configuration).
- **`--diff <base>`** — only files changed vs `main` / `master` or your branch name; good for **regression-only** gates.
- **`--staged`** — only staged files (pre-commit). Do not combine with `--diff`.

Annotations (`--annotations`) and PR comments (`github-token`) are **display-only** for exit code purposes unless paired with `--fail-on`.

## Configuration

Add **`dbt-doctor.config.json`** at the project root (or a **`"dbtDoctor"`** key in `package.json`). CLI flags override config.

**Example:**

```json
{
  "ignore": {
    "rules": ["dbt-doctor/no-select-star"],
    "files": ["models/legacy/**"],
    "overrides": [
      {
        "files": ["models/staging/_legacy_staging.sql"],
        "rules": ["dbt-doctor/staging-no-join"]
      }
    ]
  },
  "skipSqlfluff": false,
  "adoptExistingSqlfluffConfig": true,
  "offline": false
}
```

- **`ignore.rules`** — silence those rules everywhere.
- **`ignore.files`** — silence **all** rules on matching paths (use sparingly).
- **`ignore.overrides`** — silence listed rules only on matched files.
- **`ignore.tags`** — silence every rule with a given tag (e.g. design-style hints if you use them).
- **`rootDir`** — if config lives above the dbt project, point here (path relative to the config file).
- **`skipSqlfluff`** / **`customRulesOnly`** — run **only** built-in dbt-doctor rules (no Python).
- **`adoptExistingSqlfluffConfig`** — pick up `.sqlfluff` / `pyproject.toml` when present (default `true`).
- **`offline`** — skip the remote score API and **share** link; score still uses the **local** formula.
- **`surfaces`** — tune `cli`, `prComment`, `score`, and `ciFailure` independently (include/exclude by tag, category, or `plugin/rule` id).
- **`rules`** / **`categories`** — severity overrides (`error` / `warn` / `off`) for rule ids and rule categories.

Rule catalog: **[`packages/dbt-doctor-rules/RULES.md`](https://github.com/joachimhodana/dbt-doctor/blob/main/packages/dbt-doctor-rules/RULES.md)**.

### Inline suppressions (SQL / YAML)

Use **`dbt-doctor-disable-next-line`** on the line above the finding. SQL:

```sql
-- dbt-doctor-disable-next-line dbt-doctor/no-select-star
select * from {{ ref('stg_orders') }}
```

YAML / Jinja can use `#` or `--` style comments depending on context. Use **`dbt-doctor --explain path/to/file.sql:42`** (or **`--why`**) to see why a rule fired or why a suppression did not apply.

**Respect for other tools:** `.gitignore` is honored. Optional **`--no-respect-inline-disables`** neutralizes `eslint-disable` / `oxlint-disable` markers for audit-style runs (dbt-doctor’s own inline directives are controlled separately).

## CLI reference

```
Usage: dbt-doctor [directory] [options]

Options:
  -v, --version              display the version number
  --lint / --no-lint         enable or skip linting
  --verbose                  show every rule and per-file details
  --score                    output only the score
  --json                     structured JSON report on stdout
  --json-compact             with --json, minimal whitespace
  -y, --yes                  skip prompts; scan all workspace packages
  --full                     full scan (overrides diff in config / CLI)
  --project <name>           workspace package(s), comma-separated
  --diff [base]              only files changed vs base branch
  --staged                   only git-staged files
  --offline                  skip score API and share URL (local score)
  --fail-on <level>          error | warning | none
  --annotations              GitHub Actions annotation format
  --pr-comment               tune output for sticky PR comments
  --explain <file:line>      why a rule fired or suppression missed
  --why <file:line>          alias for --explain
  -h, --help                 display help

Commands:
  install|setup               install agent skills (--yes, --dry-run, -c cwd)
```

## Scoring

Formula (same locally and on the default API):

`score = round(100 − (unique error rules × 1.5) − (unique warning rules × 0.75))`

Labels: **Great** ≥ 75, **Needs work** ≥ 50, **Critical** &lt; 50.

Scores can shift when new rules ship — **pin** `dbt-doctor` in CI if you need stable numbers.

## Diff and staged modes

- **`--diff [base]`** — changed files vs branch (or `"diff": true` / `"diff": "develop"` in config).
- **`--staged`** — index-only; for pre-commit hooks.
- **`--full`** — forces a full scan.

Interactive runs may prompt to scan only changes; CI and `--json` skip that prompt.

## Node.js API

```js
import { diagnose, toJsonReport, summarizeDiagnostics } from "dbt-doctor/api";

const result = await diagnose("./path/to/dbt-project", { offline: false });

console.log(result.score); // { score, label } | null in edge cases
console.log(result.diagnostics);
console.log(result.project); // ProjectInfo: adapter, model paths, etc.
```

`diagnose` accepts options such as **`lint`**, **`offline`**, **`includePaths`**, **`respectInlineDisables`**. See [`packages/dbt-doctor/src/api.ts`](https://github.com/joachimhodana/dbt-doctor/blob/main/packages/dbt-doctor/src/api.ts).

## Leaderboard

Open-source dbt projects ranked by score. Source data: **[`benchmarks/`](https://github.com/joachimhodana/dbt-doctor/tree/main/benchmarks)** in this repo.

<!-- LEADERBOARD:START -->
<!-- prettier-ignore -->
| #  | Repo | Score |
| -- | ---- | ----: |
| — | _No entries yet — see `benchmarks/README.md`_ | — |

<!-- LEADERBOARD:END -->

**[Full leaderboard →](https://dbt-doctor.joachimhodana.com/leaderboard)**

## Monorepo & contributing

This package is part of the **[dbt-doctor](https://github.com/joachimhodana/dbt-doctor)** monorepo. To hack on the CLI locally:

```bash
git clone https://github.com/joachimhodana/dbt-doctor.git
cd dbt-doctor
pnpm install
pnpm build
node packages/dbt-doctor/bin/dbt-doctor.js /path/to/your/dbt-project
```

**Issues:** [github.com/joachimhodana/dbt-doctor/issues](https://github.com/joachimhodana/dbt-doctor/issues)

### License

This package is **MIT** — [LICENSE](https://github.com/joachimhodana/dbt-doctor/blob/main/LICENSE). Upstream credit: **dbt-doctor** is a clone of **Million** / **React Doctor** (see the note at the top of this README).
