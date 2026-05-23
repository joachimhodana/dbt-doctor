# Configuration

Place a **`.dbt-doctor`** file at your dbt project root (or monorepo root with `rootDir`). The format is INI-style: `KEY=value`, `#` comments, and dotted keys for nested options — similar to a `.env` file.

CLI flags override values in the file. Not sure which profile to use? See [Presets](/docs/getting-started/presets) (`default` = quieter, no preset = all rules). [CI](/docs/getting-started/ci) covers GitHub Actions.

## Comprehensive example

```ini
# ── Preset (optional) ────────────────────────────────────────────
# default = core only | strict = + docs + SQL style | enterprise = all 122 rules
# Omit preset to run all 122 rules with your own fail_on / score_mode
preset=enterprise
# files (default) | unique-rules
score_mode=files
# Fail inspect when project score is below this (0–10)
fail_project_under=7
# Fail when any single model score is below this (0–10)
fail_any_item_under=5
# error | warning | none — which severities fail the CLI exit code
fail_on=warning

# ── Project layout ───────────────────────────────────────────────
# When .dbt-doctor lives above dbt_project.yml (path relative to this file)
root_dir=apps/analytics
# Override manifest location (default: target/manifest.json)
manifest_path=target/manifest.json

# ── Scan behavior ────────────────────────────────────────────────
lint=true
verbose=false
# true, or a branch name like main
diff=main
offline=false
share=true
# Write / compare baseline findings
baseline=.dbt-doctor-baseline.json

# ── SQL linting ──────────────────────────────────────────────────
# Native SQL rules run by default; opt into SQLFluff subprocess
use_sqlfluff=false
skip_sqlfluff=false
adopt_existing_sqlfluff_config=true
# Only dbt-doctor rules (no SQLFluff / Python)
custom_rules_only=false

# ── Inline suppressions ──────────────────────────────────────────
respect_inline_disables=true

# ── Ignore lists ─────────────────────────────────────────────────
ignore.rules=dbt-doctor/no-select-star
ignore.files=models/legacy/**,snapshots/archive/**
ignore.tags=design

# ── Rule severity (error | warn | off) ───────────────────────────
rules.no-select-star=warn
rules.staging-no-join=error
rules.model-has-meta-keys=error

# ── Per-rule options (rules.<id>.<key>) ──────────────────────────
rules.model-has-meta-keys.required=owner,team
rules.model-name-contract.pattern=^(stg|int|fct|dim)_[a-z0-9_]+$
rules.model-name-contract.min_segments=2
rules.source-tags.allowed=raw,staging
rules.model-has-tests-by-type.schema=2
rules.model-has-tests-by-type.data=1

# ── Category severity ────────────────────────────────────────────
categories.Architecture=error
categories.SQL Style=warn

# ── Output surfaces (cli | prComment | score | ciFailure) ────────
# Design-tagged rules are excluded from score/PR/CI by default
surfaces.score.excludeTags=design
surfaces.ciFailure.excludeTags=design
surfaces.prComment.excludeTags=design
# Promote a single rule back into the score
# surfaces.score.includeRules=dbt-doctor/staging-no-join
```

## Key reference

| Key | Description |
| --- | --- |
| `preset` | Lint profile: `default` (core only), `strict` (+ docs), `enterprise` (+ governance). Omit for all rules. [Guide](/docs/getting-started/presets) |
| `score_mode` | Local score formula: `files` or `unique-rules` |
| `fail_on` | Exit code gate: `error`, `warning`, `none` |
| `fail_project_under` | Minimum project score (inspect) |
| `fail_any_item_under` | Minimum per-model score (inspect) |
| `root_dir` | dbt project directory when config is above it |
| `manifest_path` | Path to `manifest.json` |
| `baseline` | `true` or path to baseline JSON |
| `diff` | `true` or branch name for changed-files-only scans |
| `ignore.rules` | Comma-separated rule IDs to skip everywhere |
| `ignore.files` | Glob paths where all rules are skipped |
| `ignore.tags` | Skip rules with these tags (e.g. `design`) |
| `rules.<id>` | Severity for one rule |
| `rules.<id>.<option>` | Per-rule config (see [Rules reference](/docs/rules)) |
| `categories.<name>` | Severity for an entire category |
| `surfaces.<surface>.<field>` | Include/exclude tags, categories, or rules per output channel |

Rule IDs in `rules.*` and `ignore.rules` use the short form (`no-select-star`) or qualified form (`dbt-doctor/no-select-star`).

## Built-in severities

**16 rules** ship as **error** (layering, hard-coded relations, `SELECT *`, config validity, incremental/snapshot `unique_key`, exposures on private models). **106** ship as **warn**. Demote or promote any rule with `rules.<id>=warn` or `rules.<id>=error`.

## All rules

See the [Rules reference](/docs/rules) for every rule ID, descriptions, and configurable options.
