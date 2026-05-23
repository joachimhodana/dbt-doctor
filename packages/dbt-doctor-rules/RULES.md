# dbt-doctor rules catalog

> **Goal:** Be the one-stop linter for dbt projects. One `npx dbt-doctor` should replace **SQLFluff**, **dbt_project_evaluator**, **dbt_meta_testing**, **dbt-checkpoint**, **dbt-score**, and **dbt-coverage** — with zero Python, zero warehouse credentials, and zero `dbt build` needed for the default scan.

dbt-doctor linting has three layers:

| Layer | Engine | What it covers |
| ----- | ------ | -------------- |
| **dbt architecture** (today) | **dbt-doctor-rules** (this package) | Layer flow, naming, YAML/docs/tests, sources, snapshots, macros — **file-based, no warehouse** |
| **DAG / graph** (Phase 1) | `target/manifest.json` reader | Rules that [dbt_project_evaluator](https://dbt-labs.github.io/dbt-project-evaluator/latest/) currently runs via warehouse models |
| **SQL style** (Phase 5) | Native AST via `sql-parser-cst`; SQLFluff opt-in fallback | Keywords, commas, indentation, templating — without forcing `pip install` |

Rules are informed by [dbt Labs project structure](https://docs.getdbt.com/best-practices/how-we-structure/1-guide-overview), [staging](https://docs.getdbt.com/best-practices/how-we-structure/2-staging) / [marts](https://docs.getdbt.com/best-practices/how-we-structure/4-marts) guidance, [dbt_project_evaluator](https://dbt-labs.github.io/dbt-project-evaluator/latest/rules/), and [dbt-score](https://dbt-score.picnic.tech/) where we can evaluate from files alone.

## Layer flow (target DAG)

```text
sources  →  staging (stg_<src>__<entity>)  →  intermediate (int_*)  →  marts (fct_* / dim_*)
              {{ source() }} only              {{ ref() }} only           {{ ref() }} only
              no joins                         joins OK                   business logic
```

## How rules run

- **122 custom rules** registered in `rule-registry.ts`; each scans project files (SQL, YAML, seeds, macros) and optionally `manifest.json`.
- **Tags** filter rules via `ignore.tags` in `.dbt-doctor` (e.g. `ignore.tags=enterprise` skips all enterprise-tagged rules).
- **Presets** (`default` | `strict` | `enterprise`) set `ignore.tags`, `fail_on`, `score_mode`, and category severities — see [website presets doc](https://dbt-doctor.joachimhodana.com/docs/getting-started/presets). Omit `preset` to run the full catalog.
- **Severity:** **16** rules default to `error` (layering, portability, broken artifacts, `SELECT *`, incremental/snapshot `unique_key`); **106** default to `warn`. Use `rules.<id>=` to override.
- **Adapter-gated** rules (`requiresAdapter`) skip when the detected adapter does not match (e.g. BigQuery-only hints).
- **SQLFluff** runs when installed (`pip install sqlfluff sqlfluff-templater-dbt`) and `skipSqlfluff` / `customRulesOnly` is not set.

### Tag reference

| Tag | Meaning |
| --- | ------- |
| *(none)* | Core rules — always run unless disabled by `rules.<id>: off` |
| `enterprise` | Deeper governance, testing, and performance hints |
| `strict` | Documentation and contract discipline (dbt-score–style) |
| `style` / `phase5` | Native SQL formatting (ignored in `preset=enterprise` and `preset=strict`) |
| `bigquery` | Warehouse-specific performance hints |

---

## Full rule catalog (48)

### Architecture

| Rule ID | Severity | Tags | What it checks |
| ------- | -------- | ---- | -------------- |
| `source-in-downstream` | error | — | `{{ source() }}` in marts/intermediate paths (not staging) |
| `direct-source-and-ref` | error | — | Same model file uses both `source()` and `ref()` |
| `prefer-ref-over-raw-source` | error | — | Three-part `FROM schema.table` instead of `ref()` / `source()` |
| `hardcoded-database` | error | — | Literal `database.schema.table` or `schema.table` in SQL |
| `no-run-query-in-model` | error | — | `run_query()` inside model SQL |
| `staging-no-join` | warn | — | `JOIN` in models under staging layer paths |

### Naming

| Rule ID | Severity | Tags | What it checks |
| ------- | -------- | ---- | -------------- |
| `staging-prefix` | warn | — | Staging-path models should use `stg_` prefix |
| `staging-naming-convention` | warn | — | Staging models should be `stg_<source>__<entity>` |
| `intermediate-prefix` | warn | — | Intermediate-path models should use `int_` prefix |
| `marts-prefix` | warn | — | Marts-path models should use `fct_` or `dim_` prefix |
| `model-path-layer-mismatch` | warn | enterprise | `stg_` / `int_` / `fct_` / `dim_` prefix does not match folder layer |
| `no-abbreviations-in-names` | warn | strict, style | Denylisted abbreviations in model/macro/seed names (`cust`, `txn`, …) |

### Structure

| Rule ID | Severity | Tags | What it checks |
| ------- | -------- | ---- | -------------- |
| `model-outside-layer-folder` | warn | — | `.sql` directly under `models/` (not in a layer subfolder) |
| `non-canonical-layer-folder` | warn | enterprise | Non-standard first segment under `models/` (not staging/int/marts/utilities) |

### Documentation

| Rule ID | Severity | Tags | What it checks |
| ------- | -------- | ---- | -------------- |
| `schema-description` | warn | — | Model entries in schema YAML missing `description` |
| `undocumented-model` | warn | strict | `.sql` model with no matching entry in any schema YAML |
| `per-model-schema-yml` | warn | strict | Model not documented in a dedicated `schema.yml` beside the model |
| `column-description-required` | warn | enterprise, strict | Columns listed in YAML without `description` |
| `seed-documented` | warn | strict | Seed data file with no YAML entry or description |
| `macro-documented` | warn | strict | Macro `.sql` without a documented entry in `macros/*.yml` |
| `exposure-documented` | warn | enterprise | Exposure blocks missing `description` or owner |

### Sources

| Rule ID | Severity | Tags | What it checks |
| ------- | -------- | ---- | -------------- |
| `source-freshness` | warn | — | Source definitions without `freshness:` |
| `source-pii-meta` | warn | enterprise | PII-like column names without `meta` governance tags |

### Testing

| Rule ID | Severity | Tags | What it checks |
| ------- | -------- | ---- | -------------- |
| `generic-test-present` | warn | — | PK-like columns (`id`, `*_id`, `*_key`) in schema YAML without `tests:` |
| `not-null-on-required-keys` | warn | enterprise | PK/FK columns missing explicit `not_null` test |
| `relationship-test-on-fk` | warn | enterprise | FK-style columns without `relationships` test |
| `required-tests-met` | warn | — | Enforces `+required_tests` from `dbt_project.yml` on models/seeds/sources |
| `model-has-tests` | warn | enterprise | Mart models with no tests declared in YAML |
| `dbt-expectations-hint` | warn | enterprise | Suggests `dbt_expectations` for mart quality when package absent |

### Configuration

| Rule ID | Severity | Tags | What it checks |
| ------- | -------- | ---- | -------------- |
| `dbt-project-name` | error | — | Missing or placeholder `name` in `dbt_project.yml` |
| `jinja-config-block` | warn | — | Model config not in a `{{ config() }}` block at top of file |
| `materialization-hint` | warn | style | Large models (line count) without explicit `materialized` |
| `staging-materialized-view` | warn | — | Staging models materialized as `table` or `incremental` |
| `incremental-unique-key` | error | enterprise | `materialized: incremental` without `unique_key` |
| `no-unused-is-incremental` | warn | enterprise | `is_incremental()` in SQL when model is not incremental |
| `snapshot-strategy` | warn | enterprise | Snapshot YAML missing `strategy` / `updated_at` / `check_cols` |
| `snapshot-unique-key` | error | enterprise | Snapshot YAML missing `unique_key` |
| `model-contract-enforced` | warn | strict | Models with contract config but `contract.enforced` not true |

### Governance

| Rule ID | Severity | Tags | What it checks |
| ------- | -------- | ---- | -------------- |
| `required-tags-met` | warn | — | Enforces `+required_tags` from `dbt_project.yml` on models/seeds/sources |
| `model-owner-or-meta` | warn | enterprise | Mart models without `meta.owner` or `owner` |
| `seed-has-owner` | warn | strict | Documented seeds without `meta.owner` or `owner` |
| `no-hardcoded-env` | error | enterprise | Hardcoded env/project names in SQL (`prod_`, `.dev.`, …) |
| `recommended-dbt-packages` | warn | strict | `packages.yml` missing recommended packages (`dbt_utils`, …) |

### SQL quality & performance

| Rule ID | Severity | Tags | What it checks |
| ------- | -------- | ---- | -------------- |
| `no-select-star` | error | — | `SELECT *` in model SQL |
| `empty-model-file` | error | — | Model SQL file with no substantive content |
| `model-line-length` | warn | style | Physical lines longer than 120 characters |
| `excessive-cte-depth` | warn | enterprise | More than 8 `WITH` chains in one model |
| `bigquery-partition-filter` | warn | bigquery | BigQuery models likely missing partition filter (adapter-gated) |
| `cluster-by-hint` | warn | enterprise, bigquery | Large BigQuery models without `cluster_by` in config |

---

## Competitive coverage

### vs [dbt_project_evaluator](https://dbt-labs.github.io/dbt-project-evaluator/latest/)

dbt_project_evaluator materializes graph tables in the **warehouse**, then runs dbt tests. dbt-doctor scans **files on disk** plus optional **`target/manifest.json`** — faster CI, no adapter credentials for the default scan.

| Evaluator fact model | Status in dbt-doctor | Notes |
| -------------------- | -------------------- | ----- |
| **Modeling** | | |
| `fct_marts_or_intermediate_dependent_on_source` | ✅ `source-in-downstream` | File + path based |
| `fct_direct_join_to_source` | ⚠️ Partial | `direct-source-and-ref` flags co-located source+ref, not join-to-source across models |
| `fct_hard_coded_references` | ✅ `hardcoded-database`, `prefer-ref-over-raw-source` | |
| `fct_staging_dependent_on_staging` | ✅ `staging-depends-on-staging` | Manifest |
| `fct_staging_dependent_on_marts_or_intermediate` | ✅ `staging-depends-on-downstream` | Manifest |
| `fct_source_fanout` | ✅ `source-fanout` | Manifest |
| `fct_model_fanout` | ✅ `model-fanout` | Manifest |
| `fct_rejoining_of_upstream_concepts` | ✅ `rejoining-upstream-concepts` | Manifest |
| `fct_multiple_sources_joined` | ✅ `multiple-sources-joined` | Manifest + `staging-no-join` |
| `fct_root_models` | ✅ `root-models` | Manifest (informational) |
| `fct_unused_sources` | ✅ `unused-sources` | Manifest |
| `fct_duplicate_sources` | ✅ `duplicate-sources` | Manifest |
| `fct_too_many_joins` | ✅ `too-many-joins` | Manifest + SQL join count |
| **Testing** | | |
| `fct_missing_primary_key_tests` | ⚠️ Partial | `generic-test-present`, `not-null-on-required-keys` — YAML heuristic |
| `fct_sources_without_freshness` | ✅ `source-freshness` | |
| `fct_test_coverage` | ⚠️ Partial | `model-has-tests` per mart, not project % |
| **Documentation** | | |
| `fct_undocumented_models` | ✅ `schema-description`, `undocumented-model`, `per-model-schema-yml` | |
| `fct_documentation_coverage` | ⚠️ Partial | `column-description-required` |
| `fct_undocumented_source_tables` | ❌ Gap | Needs catalog / warehouse columns |
| `fct_undocumented_sources` | ✅ `undocumented-sources` | Manifest |
| **Structure** | | |
| `fct_model_naming_conventions` | ✅ Prefix + naming rules | dbt Labs style guide |
| `fct_model_directories` | ✅ `model-outside-layer-folder`, `non-canonical-layer-folder` | |
| `fct_source_directories` | ❌ Gap | No single community standard |
| `fct_test_directories` | ❌ Gap | Out of scope |
| **Performance** | | |
| `fct_chained_views_dependencies` | ✅ `chained-views` | Manifest |
| `fct_exposure_parents_materializations` | ✅ `exposure-parents-materializations` | Manifest |
| **Governance** | | |
| `fct_public_models_without_contracts` | ⚠️ Partial | `model-contract-enforced` |
| `fct_undocumented_public_models` | ⚠️ Partial | `exposure-documented` |
| `fct_exposures_dependent_on_private_models` | ✅ `exposures-on-private-models` | Manifest |

**Coverage score (evaluator rules):** ~79% weighted (see [Tool parity](https://dbt-doctor.joachimhodana.com/docs/tool-parity/dbt-project-evaluator)).

**Where dbt-doctor is stronger today**

- Zero warehouse / no `dbt build` for most checks
- Sub-second scans on medium projects; health score + GitHub Action
- SQL + Jinja + YAML in one pass (evaluator does not lint SQL style)
- Seeds, macros, snapshots, exposures, incremental hygiene
- Actionable file/line diagnostics vs querying `fct_*` tables

### vs [dbt_meta_testing](https://hub.getdbt.com/tnightengale/dbt_meta_testing/latest/)

[dbt-meta-testing](https://github.com/tnightengale/dbt-meta-testing) enforces **`+required_tests`** and **`+required_docs`** from `dbt_project.yml` via `dbt run-operation` (needs compiled project + warehouse for column discovery).

| Capability | dbt_meta_testing | dbt-doctor |
| ---------- | ---------------- | ---------- |
| Path-level `+required_tests` (regex → min count) | ✅ | ✅ `required-tests-met` (file-based) |
| Path-level `+required_docs` | ✅ (warehouse columns) | ⚠️ `required-docs-met` (file-based; no warehouse column discovery) |
| Runs without warehouse | ❌ | ✅ |
| CI as single CLI | ❌ (separate run-operation) | ✅ |

**Overlap:** `model-has-tests`, `generic-test-present`, `not-null-on-required-keys`, `relationship-test-on-fk`, documentation rules approximate meta-testing defaults but do not read `+required_*` config.

**Complement:** Teams can run dbt-doctor on every PR and meta-testing (or evaluator) on nightly `dbt build`.

### vs SQLFluff

| Concern | Owner today | Owner after Phase 5 |
| ------- | ----------- | ------------------- |
| SQL layout, capitalization, trailing commas, templating errors | **SQLFluff** (subprocess) | **dbt-doctor** (native AST); SQLFluff opt-in via `--use-sqlfluff` |
| dbt layer architecture, naming, YAML contracts, source freshness | **dbt-doctor** | **dbt-doctor** |

Until Phase 5 lands, keep using SQLFluff for SQL style; respect `.sqlfluff` / `pyproject.toml` via `adoptExistingSqlfluffConfig`. Phase 5 deprecates the Python dependency by default.

### vs [dbt-checkpoint](https://github.com/dbt-checkpoint/dbt-checkpoint)

Pre-commit hooks (~50 checks) requiring `manifest.json`. Heavily configurable, each hook is one parameterized rule that takes flags like `--tests not_null=1 unique=1`.

| Capability | dbt-checkpoint | dbt-doctor today | After Phase 3 |
| ---------- | -------------- | ---------------- | ------------- |
| Per-rule config flags | ✅ (CLI flags per hook) | ⚠️ Severity only | ✅ `.dbt-doctor` `rules.<id>.<key>=` |
| Model meta/labels/tags enforcement | ✅ | ❌ | ✅ |
| `model-name-contract` / `column-name-contract` | ✅ | ⚠️ Fixed prefixes only | ✅ Configurable regex |
| `model-has-tests-by-{name,type,group}` | ✅ | ⚠️ `model-has-tests` (counts only) | ✅ |
| Parent-* checks (schema/database/prefix) | ✅ (manifest) | ❌ | ✅ via Phase 1 manifest |
| `check-script-semicolon` | ✅ | ❌ | ✅ |
| `database-casing-consistency` | ✅ | ❌ | ✅ |
| Runs as pre-commit + standalone | ✅ | ✅ (CLI + Action) | ✅ |
| Zero Python | ❌ | ✅ | ✅ |

### vs [dbt-score](https://dbt-score.picnic.tech/)

Picnic's manifest-based scorer (~14 generic rules + custom Python rules). Strength is **per-entity scoring**; weakness is requiring Python + `manifest.json`.

| Capability | dbt-score | dbt-doctor today | After Phase 4 |
| ---------- | --------- | ---------------- | ------------- |
| Per-model score | ✅ (weighted by severity 1–4) | ❌ (project-level only) | ✅ `--show-per-model-scores` |
| `fail_project_under` / `fail_any_item_under` | ✅ | ⚠️ Project only | ✅ |
| Custom rule plugin API | ✅ Python | ✅ TypeScript (`DbtDoctorPlugin`) | ✅ |
| Built-in rule equivalents (`has_description`, `has_owner`, `has_uniqueness_test`, `has_no_unused_is_incremental`, `snapshot_has_*`, `sql_has_reasonable_number_of_lines`) | ✅ | ✅ (1:1 coverage) | ✅ |
| Badges / score history | ✅ | ❌ | Optional |

### vs [dbt-coverage](https://github.com/slidoapp/dbt-coverage)

Lightweight tool that prints test % and doc % from manifest + catalog.

| Capability | dbt-coverage | dbt-doctor after Phase 1 + 4 |
| ---------- | ------------ | ---------------------------- |
| `% docs` / `% tests` printout | ✅ | ✅ `--coverage` |
| `compare` between branches | ✅ | Via baseline (`writeBaseline`) |
| Catalog-based column coverage | ✅ (needs `catalog.json`) | Phase 1 (manifest) + future catalog |

---

## Consolidation roadmap

Phased plan to absorb every other dbt linter. Each phase is independently shippable; rule IDs below are reserved so configs written today survive the rollout.

### Phase 1 — Manifest reader (covers `dbt_project_evaluator`)

New package `@dbt-doctor/manifest` reads `target/manifest.json`. If missing, **warn once and skip** the manifest rules (file-based rules keep running, never block users without a built project). Opt-in `--manifest <path>` and `runDbtParse: true` for CI.

`RuleContext` gains optional `manifest?: ManifestGraph`; new rules declare `requiresManifest: true`.

| Planned rule ID | Evaluator equivalent | Notes |
| --------------- | -------------------- | ----- |
| `staging-depends-on-staging` | `fct_staging_dependent_on_staging` | DAG edges |
| `staging-depends-on-downstream` | `fct_staging_dependent_on_marts_or_intermediate` | DAG edges |
| `source-fanout` | `fct_source_fanout` | DAG metric |
| `model-fanout` | `fct_model_fanout` | DAG metric |
| `too-many-joins` | `fct_too_many_joins` | Manifest + SQL |
| `rejoining-upstream-concepts` | `fct_rejoining_of_upstream_concepts` | DAG analysis |
| `chained-views` | `fct_chained_views_dependencies` | Materialization graph |
| `unused-sources` | `fct_unused_sources` | Manifest |
| `duplicate-sources` | `fct_duplicate_sources` | Manifest |
| `undocumented-sources` | `fct_undocumented_sources` | Manifest |
| `exposure-parents-materializations` | `fct_exposure_parents_materializations` | Manifest |
| `exposures-on-private-models` | `fct_exposures_dependent_on_private_models` | Manifest |
| `root-models` | `fct_root_models` | DAG (informational) |
| `multiple-sources-joined` | `fct_multiple_sources_joined` | DAG + join count |

### Phase 2 — `+required_tests` / `+required_docs` (covers `dbt_meta_testing`)

Read `dbt_project.yml` `models:` / `seeds:` / `sources:` tree natively:

```yaml
models:
  my_project:
    marts:
      +required_tests: { not_null: 1, unique: 1 }
      +required_docs: true
      +required_tags: [daily, hourly, nightly]
```

| Planned rule ID | dbt_meta_testing equivalent |
| --------------- | --------------------------- |
| ✅ `required-tests-met` | `required_tests` (path-level minimums on models/seeds/sources) |
| ✅ `required-docs-met` | `required_docs` (model/seed/source docs requirements) |
| ✅ `required-tags-met` | `required_tags` parity (models/seeds/sources) |

Works file-based (no warehouse). Manifest-aware column augmentation remains future enhancement.

### Phase 3 — Per-rule config + dbt-checkpoint hook parity

Most `check-model-*-by-name` / `-by-type` / `-by-group` hooks are one parameterized rule. Surface this via `.dbt-doctor`:

```ini
rules.model-has-tests-by-name.unique=1
rules.model-has-tests-by-name.not_null=1
rules.model-tags.allowed=daily,hourly,nightly
rules.model-meta-keys.required=owner,team,sla
rules.model-name-contract.pattern=^(stg|int|fct|dim)_[a-z0-9_]+$
rules.column-name-contract.pattern.amount=^.*_amount$
```

`RuleContext` gains `ruleConfig: Record<string, unknown>`; rules read their slice.

| Planned rule ID | dbt-checkpoint hook |
| --------------- | ------------------- |
| ✅ `model-has-meta-keys` | `check-model-has-meta-keys`, `check-model-columns-have-meta-keys` |
| ✅ `model-has-labels-keys` | `check-model-has-labels-keys` |
| ✅ `model-tags` | `check-model-tags` |
| ✅ `model-has-tests-by-name` | `check-model-has-tests-by-name` |
| ✅ `model-has-tests-by-type` | `check-model-has-tests-by-type` |
| ✅ `model-has-tests-by-group` | `check-model-has-tests-by-group` |
| ✅ `model-has-constraints` | `check-model-has-constraints` |
| ✅ `model-has-generic-constraints` | `check-model-has-generic-constraints` |
| ✅ `model-has-all-columns` | `check-model-has-all-columns` (needs manifest) |
| ✅ `column-desc-are-same` | `check-column-desc-are-same` |
| ✅ `column-name-contract` | `check-column-name-contract` |
| ✅ `model-name-contract` | `check-model-name-contract` |
| ✅ `database-casing-consistency` | `check-database-casing-consistency` |
| ✅ `model-parents-schema` | `check-model-parents-schema` (manifest) |
| ✅ `model-parents-name-prefix` | `check-model-parents-name-prefix` (manifest) |
| ✅ `model-parents-database` | `check-model-parents-database` (manifest) |
| ✅ `model-materialization-by-childs` | `check-model-materialization-by-childs` (manifest) |
| ✅ `source-has-loader` | `check-source-has-loader` |
| ✅ `source-has-meta-keys` | `check-source-has-meta-keys` |
| ✅ `source-has-labels-keys` | `check-source-has-labels-keys` |
| ✅ `source-tags` | `check-source-tags` |
| ✅ `source-childs` | `check-source-childs` (manifest) |
| ✅ `exposure-has-meta-keys` | `check-exposure-has-meta-keys` |
| ✅ `seed-has-meta-keys` | `check-seed-has-meta-keys` |
| ✅ `snapshot-has-meta-keys` | `check-snapshot-has-meta-keys` |
| ✅ `test-has-meta-keys` | `check-test-has-meta-keys` |
| ✅ `test-tags` | `check-test-tags` |
| ✅ `macro-arguments-have-desc` | `check-macro-arguments-have-desc` |
| ✅ `script-semicolon` | `check-script-semicolon` |

### Phase 4 — Per-entity score + coverage (covers `dbt-score` + `dbt-coverage`)

- Per-model score table: `dbt-doctor --show-per-model-scores`
- Coverage numbers: `dbt-doctor --coverage` → `Tests: 67% • Docs: 82%`
- Config: `failProjectUnder` (default 5.0), `failAnyItemUnder` (default 5.0) — ported from dbt-score
- Severity weights in `.dbt-doctor` so per-entity scoring matches dbt-score's `severity = 1..4` model

### Phase 5 — Native SQL parser (deprecates SQLFluff dependency)

Goal state: **SQLFluff is opt-in via `--use-sqlfluff`**, native parser is the default. Until the native ruleset reaches parity, SQLFluff remains available for power users — migration is gradual, not a hard cutover.

- Bundle `sql-parser-cst` (lossless CST, dialects: ANSI / PG / BQ / Snowflake / SQLite).
- Harden the Jinja stripper in `@dbt-doctor/core` so it produces parseable SQL.
- Native versions of the most-used SQLFluff rules:
  - `sql-no-semicolon` (dbt-checkpoint's `check-script-semicolon`)
  - `sql-keywords-case`, `sql-trailing-commas`, `sql-leading-commas`
  - `sql-references-only-via-ref-or-source` (extends `prefer-ref-over-raw-source`)
  - AST-based replacements for `no-select-star`, `staging-no-join`, `excessive-cte-depth` (fewer false positives than regex)
- Add `--use-sqlfluff` flag; deprecate `skipSqlfluff` once parity reached.
- Track parity in `packages/dbt-doctor-rules/sqlfluff-parity.json` (see website Tool parity docs).

---

## Common mistakes → rules

| Mistake | Rule(s) |
| ------- | ------- |
| Joining in staging | `staging-no-join` |
| `source()` in mart SQL | `source-in-downstream` |
| `my_db.schema.table` in SQL | `hardcoded-database` |
| `source()` + `ref()` same model | `direct-source-and-ref` |
| `SELECT *` | `no-select-star` |
| No freshness on sources | `source-freshness` |
| No docs on models | `schema-description`, `undocumented-model` |
| No tests on id columns | `generic-test-present`, `not-null-on-required-keys` |
| `run_query()` in models | `no-run-query-in-model` |
| Flat `models/*.sql` | `model-outside-layer-folder` |
| Dead `is_incremental()` branch | `no-unused-is-incremental` |
| Incremental without `unique_key` | `incremental-unique-key` |

---

## References

- [How we structure our dbt projects](https://docs.getdbt.com/best-practices/how-we-structure/1-guide-overview)
- [Staging layer](https://docs.getdbt.com/best-practices/how-we-structure/2-staging)
- [Marts layer](https://docs.getdbt.com/best-practices/how-we-structure/4-marts)
- [dbt_project_evaluator — list of rules](https://dbt-labs.github.io/dbt-project-evaluator/latest/rules/)
- [dbt_meta_testing on dbt Hub](https://hub.getdbt.com/tnightengale/dbt_meta_testing/latest/)
- [SQLFluff](https://docs.sqlfluff.com/)
- [Lint and format (dbt + SQLFluff)](https://docs.getdbt.com/docs/cloud/dbt-cloud-ide/lint-format)
