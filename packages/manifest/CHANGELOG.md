# @dbt-doctor/manifest

## 0.3.2

### Patch Changes

- Eliminate remaining Jinja and dbt-SQL false positives on real projects (multi-line joins, comments, incremental blocks, Snowflake star exclude).

## 0.3.1

### Patch Changes

- Reduce Jinja-related false positives on real dbt projects and apply the default preset when no config file exists.

  ### Fixed

  - Skip Jinja blocks in SQL style rules (`source()` comma joins, `model.name`, `trim_all_columns`, config meta quotes).
  - Treat `ref()` to seeds as valid manifest targets; count seed parents in `root-models`; skip models from dependency packages.
  - Read `materialized` from model YAML in `materialization-hint`.
  - Map Snowflake/Databricks adapters to a PostgreSQL-compatible CST dialect for `no-select-star`.
  - Apply `preset=default` when `.dbt-doctor` is missing (instead of running the full rule catalog).

  ### Added

  - `jinja-sql-scan` helper and regression tests for common dbt SQL patterns.

## 0.3.0

### Minor Changes

- Ship native tool parity, presets, and docs site refresh.

  ### Breaking

  - Remove `config.baseline` and `--write-baseline`; use `ignore.rules` / `ignore.files` instead.
  - Apply `preset=default` when `preset` is omitted in `.dbt-doctor`.
  - Rename style tier tag from `phase5` to `sql-style` (ignore lists using the old tag still work via alias).

  ### Features

  - Add ~190 built-in rules with parity for SQLFluff (74 codes), dbt-checkpoint, dbt-score, and dbt_meta_testing.
  - Native SQL/Jinja lint in Node (`skip_sqlfluff=true` by default); optional SQLFluff subprocess with `--use-sqlfluff`.
  - Presets `default`, `strict`, and `enterprise` control which rule families run in CI.
  - Coverage summary (`--coverage`), per-model scores, and `fail_project_under` / `fail_any_item_under` score gates.
  - `@dbt-doctor/manifest` package for graph-aware rules when `manifest.json` is present.
  - Documentation site: rules catalog, tool parity, presets, and SQLFluff migration guide.
