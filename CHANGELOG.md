# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.2] - 2026-05-31

### Fixed

- **SQL comment false positives** — rules skip `-- Columns from...` and `E.G.` in dim header comments.
- **`sql-no-comma-join`** — scope FROM scanning to the clause (stop at `JOIN`, `)`, subqueries); ignore CTE `),` separators.
- **`sql-reference-object-in-from`** — collect aliases from multi-line joins, subquery `) alias on`, and `from base sales`; ignore comment lines.
- **`sql-expression-alias-required`** — skip `{% if is_incremental() %}` bodies, `a.*`, `{{ model.name }}.*`, and Snowflake `* EXCLUDE (...)`.
- **`sql-set-operator-column-count-match`** — ignore `SELECT`/`FROM` words in line comments.

### Added

- Regression tests for common dbt Jinja/SQL edge cases (multi-line join, dim comments, incremental blocks).

## [0.3.1] - 2026-05-25

### Added

- Root `CHANGELOG.md` for release visibility (Keep a Changelog format).
- `jinja-sql-scan` helper and regression tests for common dbt Jinja/SQL patterns.

### Fixed

- **Jinja false positives** — SQL style rules no longer flag `source("a", "b")` commas, `{{ model.name }}`, `trim_all_columns()`, or quoted strings inside `{{ config() }}`.
- **`sql-join-condition-required`** — `ON` on a new line is recognized.
- **`sql-set-operator-column-count-match`** — skip `UNION BY NAME` (Snowflake).
- **`sql-clause-newline-consistency`** — ignore `-- where` in line comments.
- **`materialization-hint`** — reads `materialized` from model YAML, not only inline `{{ config() }}`.
- **`sql-reference-target-exists`** — accepts `ref()` to **seeds**.
- **`root-models`** — treats seed dependencies as upstream; ignores models from installed packages (e.g. mesh stubs).
- **Default preset** — projects without `.dbt-doctor` now use `preset=default` instead of the full ~190-rule catalog.
- **Snowflake parsing** — map Snowflake/Databricks to a PostgreSQL-compatible CST dialect for better `no-select-star` coverage.

## [0.3.0] - 2026-05-25

### Added

- ~190 built-in rules with native parity for SQLFluff (74 codes), dbt-checkpoint, dbt-score, and dbt_meta_testing.
- Presets: `default` (quiet core), `strict` (docs + SQL style), `enterprise` (full governance).
- Native SQL/Jinja lint in Node (`skip_sqlfluff=true` by default); optional SQLFluff subprocess.
- Coverage summary (`--coverage`), per-model scores, and score gates (`fail_project_under`, `fail_any_item_under`).
- `@dbt-doctor/manifest` for graph-aware rules when `target/manifest.json` exists.
- Documentation site: rules catalog, tool parity pages, presets, SQLFluff migration guide.

### Changed

- Apply `preset=default` when `preset` is omitted in `.dbt-doctor`.
- Rename style tier tag from `phase5` to `sql-style` (legacy alias still works).

### Removed

- `config.baseline` and `--write-baseline` — use `ignore.rules` / `ignore.files` instead.

## [0.2.0] - 2026-04-XX

### Added

- `.dbt-doctor` props config file, files-based scoring, CLI flags for preset / score-mode / fail-on.

## [0.1.0] - 2026-03-XX

### Added

- Enterprise lint rules, SARIF output, baseline filtering, GitHub Action.

## [0.0.2] - 2026-02-XX

### Added

- First public npm release: `dbt-doctor` CLI and `dbt-doctor-rules`.

[Unreleased]: https://github.com/joachimhodana/dbt-doctor/compare/dbt-doctor@0.3.2...HEAD
[0.3.2]: https://github.com/joachimhodana/dbt-doctor/compare/dbt-doctor@0.3.1...dbt-doctor@0.3.2
[0.3.1]: https://github.com/joachimhodana/dbt-doctor/compare/dbt-doctor@0.3.0...dbt-doctor@0.3.1
[0.3.0]: https://github.com/joachimhodana/dbt-doctor/releases/tag/dbt-doctor%400.3.0
