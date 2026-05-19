# dbt-doctor rules catalog

Rules are informed by [dbt Labs project structure](https://docs.getdbt.com/best-practices/how-we-structure/1-guide-overview), [staging guidance](https://docs.getdbt.com/best-practices/how-we-structure/2-staging), [marts guidance](https://docs.getdbt.com/best-practices/how-we-structure/4-marts), and [dbt_project_evaluator](https://dbt-labs.github.io/dbt-project-evaluator/main/rules/) modeling checks.

SQL style issues (keywords, commas, CTE layout) are delegated to **sqlfluff** when installed. Custom rules focus on dbt-specific architecture, naming, docs, and config.

## Layer flow (target DAG)

```text
sources  →  staging (stg_<src>__<entity>)  →  intermediate (int_*)  →  marts (fct_* / dim_*)
              {{ source() }} only              {{ ref() }} only           {{ ref() }} only
              no joins                         joins OK                   business logic
```

## Implemented rules

| Rule ID                      | Severity | Category      | What it checks                             | dbt_project_evaluator / docs                                                                        |
| ---------------------------- | -------- | ------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `no-select-star`             | warn     | SQL Quality   | `SELECT *` in models                       | SQL style                                                                                           |
| `staging-prefix`             | warn     | Naming        | `stg_` prefix in staging paths             | Structure                                                                                           |
| `staging-naming-convention`  | warn     | Naming        | `stg_<source>__<entity>` double underscore | [Naming guide](https://docs.getdbt.com/best-practices/how-we-style/1-how-we-style-our-dbt-projects) |
| `staging-no-join`            | warn     | Architecture  | JOIN in staging models                     | Staging best practices                                                                              |
| `staging-materialized-view`  | warn     | Configuration | table/incremental in staging               | Staging best practices                                                                              |
| `intermediate-prefix`        | warn     | Naming        | `int_` in intermediate paths               | Structure                                                                                           |
| `marts-prefix`               | warn     | Naming        | `fct_` / `dim_` in marts paths             | Marts best practices                                                                                |
| `model-outside-layer-folder` | warn     | Structure     | `.sql` directly under `models/`            | Project structure                                                                                   |
| `schema-description`         | warn     | Documentation | Missing model description in schema.yml    | `fct_undocumented_models`                                                                           |
| `generic-test-present`       | warn     | Testing       | PK-like columns without tests              | `fct_missing_primary_key_tests`                                                                     |
| `source-freshness`           | warn     | Sources       | Sources without `freshness:`               | `fct_sources_without_freshness`                                                                     |
| `source-in-downstream`       | error    | Architecture  | `{{ source() }}` in marts/intermediate     | `fct_marts_or_intermediate_dependent_on_source`                                                     |
| `direct-source-and-ref`      | warn     | Architecture  | Same file uses `source()` and `ref()`      | `fct_direct_join_to_source`                                                                         |
| `prefer-ref-over-raw-source` | warn     | Architecture  | Three-part `FROM` without ref              | Related to hard-coded refs                                                                          |
| `hardcoded-database`         | error    | Architecture  | `schema.table` literals                    | `fct_hard_coded_references`                                                                         |
| `no-run-query-in-model`      | error    | Architecture  | `run_query()` in model SQL                 | Imperative anti-pattern                                                                             |
| `dbt-project-name`           | warn     | Configuration | Project name quality in `dbt_project.yml`  | Governance                                                                                          |
| `bigquery-partition-filter`  | warn     | SQL Quality   | BigQuery partition filters (adapter-gated) | Warehouse-specific                                                                                  |
| `materialization-hint`       | warn     | Configuration | Large models without `materialized`        | Performance                                                                                         |
| `empty-model-file`           | warn     | SQL Quality   | Empty model files                          | Hygiene                                                                                             |
| `jinja-config-block`         | warn     | Configuration | Config not at top of file                  | Style                                                                                               |

## Planned (needs manifest / graph)

These require `manifest.json` or dependency graph analysis — good candidates for a future pass:

| Check                           | Evaluator rule                           | Why deferred                  |
| ------------------------------- | ---------------------------------------- | ----------------------------- |
| Staging depends on staging      | `fct_staging_dependent_on_staging`       | Needs DAG                     |
| Model fanout / too many joins   | `fct_model_fanout`, `fct_too_many_joins` | Needs DAG + join count        |
| Unused sources                  | `fct_unused_sources`                     | Needs manifest                |
| Duplicate sources               | `fct_duplicate_sources`                  | Needs source YAML + warehouse |
| Rejoining upstream concepts     | `fct_rejoining_of_upstream_concepts`     | Needs DAG                     |
| Test / documentation coverage % | `fct_test_coverage`                      | Needs manifest aggregation    |

## Common mistakes → rules mapping

| Mistake                         | Rule(s)                      |
| ------------------------------- | ---------------------------- |
| Joining in staging              | `staging-no-join`            |
| `source()` in mart SQL          | `source-in-downstream`       |
| `my_db.schema.table` in SQL     | `hardcoded-database`         |
| `source()` + `ref()` same model | `direct-source-and-ref`      |
| `SELECT *`                      | `no-select-star`             |
| No freshness on sources         | `source-freshness`           |
| No docs on models               | `schema-description`         |
| No tests on id columns          | `generic-test-present`       |
| `run_query()` in models         | `no-run-query-in-model`      |
| Flat `models/*.sql`             | `model-outside-layer-folder` |

## References

- [How we structure our dbt projects](https://docs.getdbt.com/best-practices/how-we-structure/1-guide-overview)
- [Staging layer](https://docs.getdbt.com/best-practices/how-we-structure/2-staging)
- [Marts layer](https://docs.getdbt.com/best-practices/how-we-structure/4-marts)
- [dbt_project_evaluator rules](https://dbt-labs.github.io/dbt-project-evaluator/main/rules/)
- [Lint and format (SQLFluff)](https://docs.getdbt.com/docs/cloud/dbt-cloud-ide/lint-format)
