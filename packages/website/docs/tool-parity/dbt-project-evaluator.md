# dbt_project_evaluator

[dbt_project_evaluator](https://dbt-labs.github.io/dbt-project-evaluator/latest/) materializes graph **fact tables in the warehouse**, then runs dbt tests against them. dbt-doctor reads **`target/manifest.json`** (and project files) so CI does not need adapter credentials for the same class of checks.

**Coverage: 79.31%** (20 covered, 6 partial, 3 not planned) of 29 upstream checks.

[← Tool parity](/docs/tool-parity)

## Upstream rule inventory (29)

Scraped from the [official rule list](https://dbt-labs.github.io/dbt-project-evaluator/latest/rules/) (May 2026).

| Category | Friendly name | Fact model |
| -------- | ------------- | ---------- |
| Modeling | Staging Models Dependent on Other Staging Models | `fct_staging_dependent_on_staging` |
| Modeling | Source Fanout | `fct_source_fanout` |
| Modeling | Rejoining of Upstream Concepts | `fct_rejoining_of_upstream_concepts` |
| Modeling | Model Fanout | `fct_model_fanout` |
| Modeling | Downstream Models Dependent on Source | `fct_marts_or_intermediate_dependent_on_source` |
| Modeling | Direct Join to Source | `fct_direct_join_to_source` |
| Modeling | Duplicate Sources | `fct_duplicate_sources` |
| Modeling | Hard Coded References | `fct_hard_coded_references` |
| Modeling | Multiple Sources Joined | `fct_multiple_sources_joined` |
| Modeling | Root Models | `fct_root_models` |
| Modeling | Staging Models Dependent on Downstream Models | `fct_staging_dependent_on_marts_or_intermediate` |
| Modeling | Unused Sources | `fct_unused_sources` |
| Modeling | Models with Too Many Joins | `fct_too_many_joins` |
| Testing | Missing Primary Key Tests | `fct_missing_primary_key_tests` |
| Testing | Missing Source Freshness | `fct_sources_without_freshness` |
| Testing | Test Coverage | `fct_test_coverage` |
| Documentation | Undocumented Models | `fct_undocumented_models` |
| Documentation | Documentation Coverage | `fct_documentation_coverage` |
| Documentation | Undocumented Source Tables | `fct_undocumented_source_tables` |
| Documentation | Undocumented Sources | `fct_undocumented_sources` |
| Structure | Test Directories | `fct_test_directories` |
| Structure | Model Naming Conventions | `fct_model_naming_conventions` |
| Structure | Source Directories | `fct_source_directories` |
| Structure | Model Directories | `fct_model_directories` |
| Performance | Chained View Dependencies | `fct_chained_views_dependencies` |
| Performance | Exposure Parents Materializations | `fct_exposure_parents_materializations` |
| Governance | Public Models Without Contracts | `fct_public_models_without_contracts` |
| Governance | Exposures Dependent on Private Models | `fct_exposures_dependent_on_private_models` |
| Governance | Undocumented Public Models | `fct_undocumented_public_models` |

## Parity map

| Fact model | Status | dbt-doctor rule(s) | Notes |
| ---------- | ------ | ------------------ | ----- |
| `fct_staging_dependent_on_staging` | Covered | [`staging-depends-on-staging`](/docs/rules#staging-depends-on-staging) | Requires `manifest.json` |
| `fct_source_fanout` | Covered | [`source-fanout`](/docs/rules#source-fanout) | Manifest |
| `fct_rejoining_of_upstream_concepts` | Covered | [`rejoining-upstream-concepts`](/docs/rules#rejoining-upstream-concepts) | Manifest |
| `fct_model_fanout` | Covered | [`model-fanout`](/docs/rules#model-fanout) | Manifest |
| `fct_marts_or_intermediate_dependent_on_source` | Covered | [`source-in-downstream`](/docs/rules#source-in-downstream) | File paths + `source()` in SQL |
| `fct_direct_join_to_source` | Partial | [`direct-source-and-ref`](/docs/rules#direct-source-and-ref) | Flags co-located `source()` + `ref()`, not cross-model join graph |
| `fct_duplicate_sources` | Covered | [`duplicate-sources`](/docs/rules#duplicate-sources) | Manifest |
| `fct_hard_coded_references` | Covered | [`hardcoded-database`](/docs/rules#hardcoded-database), [`prefer-ref-over-raw-source`](/docs/rules#prefer-ref-over-raw-source) | |
| `fct_multiple_sources_joined` | Covered | [`multiple-sources-joined`](/docs/rules#multiple-sources-joined) | Manifest; also [`staging-no-join`](/docs/rules#staging-no-join) for staging files |
| `fct_root_models` | Covered | [`root-models`](/docs/rules#root-models) | Manifest (informational) |
| `fct_staging_dependent_on_marts_or_intermediate` | Covered | [`staging-depends-on-downstream`](/docs/rules#staging-depends-on-downstream) | Manifest |
| `fct_unused_sources` | Covered | [`unused-sources`](/docs/rules#unused-sources) | Manifest |
| `fct_too_many_joins` | Covered | [`too-many-joins`](/docs/rules#too-many-joins) | Manifest + SQL join count |
| `fct_missing_primary_key_tests` | Partial | [`generic-test-present`](/docs/rules#generic-test-present), [`not-null-on-required-keys`](/docs/rules#not-null-on-required-keys) | YAML heuristics, not graph PK detection |
| `fct_sources_without_freshness` | Covered | [`source-freshness`](/docs/rules#source-freshness) | |
| `fct_test_coverage` | Partial | [`model-has-tests`](/docs/rules#model-has-tests) | Per-model minimums, not project-wide % |
| `fct_undocumented_models` | Covered | [`schema-description`](/docs/rules#schema-description), [`undocumented-model`](/docs/rules#undocumented-model), [`per-model-schema-yml`](/docs/rules#per-model-schema-yml) | Stricter in `preset=strict` |
| `fct_documentation_coverage` | Partial | [`column-description-required`](/docs/rules#column-description-required) | Column-level, not warehouse catalog % |
| `fct_undocumented_source_tables` | Not planned | — | See [`undocumented-sources`](/docs/rules#undocumented-sources) for source-level; table-level needs catalog or manifest columns |
| `fct_undocumented_sources` | Covered | [`undocumented-sources`](/docs/rules#undocumented-sources) | Manifest |
| `fct_test_directories` | Not planned | — | Evaluator enforces `tests/` layout; dbt-doctor focuses on `models/` layers. Use evaluator or custom path rule if required |
| `fct_model_naming_conventions` | Covered | [`staging-prefix`](/docs/rules#staging-prefix), [`intermediate-prefix`](/docs/rules#intermediate-prefix), [`marts-prefix`](/docs/rules#marts-prefix), [`staging-naming-convention`](/docs/rules#staging-naming-convention), [`model-path-layer-mismatch`](/docs/rules#model-path-layer-mismatch) | More opinionated (dbt Labs guide) |
| `fct_source_directories` | Not planned | — | No standard for source folder depth across adapters; teams vary `sources/` layout |
| `fct_model_directories` | Covered | [`model-outside-layer-folder`](/docs/rules#model-outside-layer-folder), [`non-canonical-layer-folder`](/docs/rules#non-canonical-layer-folder) | |
| `fct_chained_views_dependencies` | Covered | [`chained-views`](/docs/rules#chained-views) | Manifest + materialization |
| `fct_exposure_parents_materializations` | Covered | [`exposure-parents-materializations`](/docs/rules#exposure-parents-materializations) | Manifest |
| `fct_public_models_without_contracts` | Partial | [`model-contract-enforced`](/docs/rules#model-contract-enforced) | Checks `contract.enforced`, not full YAML contract body |
| `fct_exposures_dependent_on_private_models` | Covered | [`exposures-on-private-models`](/docs/rules#exposures-on-private-models) | Manifest |
| `fct_undocumented_public_models` | Partial | [`exposure-documented`](/docs/rules#exposure-documented) | Exposure docs, not all public models |

## Not planned (and why)

| Gap | Reason |
| --- | ------ |
| `fct_test_directories` | dbt-doctor targets model DAG hygiene, not generic test folder layout |
| `fct_source_directories` | No single community standard for source paths |
| `fct_undocumented_source_tables` | Needs `catalog.json` or compiled columns; tracked under [dbt-coverage](/docs/tool-parity/dbt-coverage) column coverage |

## Running without a warehouse

```bash
dbt parse   # produces target/manifest.json
npx dbt-doctor@latest --manifest target/manifest.json
```

If manifest is missing, manifest rules are **skipped once** with a warning; file-based rules still run.

## Where dbt-doctor is stronger

- No `dbt build` or warehouse tables (`fct_*` models)
- SQL + YAML + Jinja in one pass (evaluator does not lint SQL style)
- Sub-second scans on medium projects; unified health score
