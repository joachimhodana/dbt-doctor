# dbt-checkpoint

[dbt-checkpoint](https://github.com/dbt-checkpoint/dbt-checkpoint) provides **~48 lint hooks** for [pre-commit](https://pre-commit.com), each reading `manifest.json` (and sometimes `catalog.json`). dbt-doctor maps the same checks to **TypeScript rules** with `.dbt-doctor` configuration.

**Coverage: 75%** (34 covered, 4 partial, 10 not planned) of 48 upstream checks.

[← Tool parity](/docs/tool-parity)

## Upstream hook inventory (48 lint hooks)

Scraped from the [dbt-checkpoint README](https://github.com/dbt-checkpoint/dbt-checkpoint/blob/main/README.md) (May 2026).

### Model (23)

`check-column-desc-are-same`, `check-column-name-contract`, `check-model-columns-have-desc`, `check-model-columns-have-meta-keys`, `check-model-has-all-columns`, `check-model-has-contract`, `check-model-has-constraints`, `check-model-has-generic-constraints`, `check-model-has-description`, `check-model-has-meta-keys`, `check-model-has-labels-keys`, `check-model-has-properties-file`, `check-model-has-tests-by-name`, `check-model-has-tests-by-type`, `check-model-has-tests-by-group`, `check-model-has-tests`, `check-model-name-contract`, `check-model-parents-and-childs`, `check-model-parents-database`, `check-model-parents-name-prefix`, `check-model-parents-schema`, `check-model-tags`, `check-model-materialization-by-childs`

### Script (3)

`check-script-semicolon`, `check-script-has-no-table-name`, `check-script-ref-and-source`

### Source (14)

`check-source-columns-have-desc`, `check-source-has-all-columns`, `check-source-has-description`, `check-source-table-has-description`, `check-source-has-freshness`, `check-source-has-loader`, `check-source-has-meta-keys`, `check-source-has-labels-keys`, `check-source-has-tests-by-name`, `check-source-has-tests-by-type`, `check-source-has-tests`, `check-source-has-tests-by-group`, `check-source-tags`, `check-source-childs`

### Macro (3)

`check-macro-has-description`, `check-macro-arguments-have-desc`, `check-macro-has-meta-keys`

### Other entities (4)

`check-exposure-has-meta-keys`, `check-seed-has-meta-keys`, `check-snapshot-has-meta-keys`, `check-test-has-meta-keys`

### dbt project (1)

`check-database-casing-consistency`

## Parity map (lint hooks only)

| dbt-checkpoint hook                     | Status      | dbt-doctor rule                                                                                                                |
| --------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `check-column-desc-are-same`            | Covered     | [`column-desc-are-same`](/docs/rules#column-desc-are-same)                                                                     |
| `check-column-name-contract`            | Covered     | [`column-name-contract`](/docs/rules#column-name-contract)                                                                     |
| `check-model-columns-have-desc`         | Covered     | [`column-description-required`](/docs/rules#column-description-required)                                                       |
| `check-model-columns-have-meta-keys`    | Not planned | —                                                                                                                              | Use [`model-has-meta-keys`](/docs/rules#model-has-meta-keys) at model level; column-meta parity is low demand vs config complexity                      |
| `check-model-has-all-columns`           | Covered     | [`model-has-all-columns`](/docs/rules#model-has-all-columns)                                                                   | Manifest                                                                                                                                                |
| `check-model-has-contract`              | Covered     | [`model-contract-enforced`](/docs/rules#model-contract-enforced)                                                               |
| `check-model-has-constraints`           | Covered     | [`model-has-constraints`](/docs/rules#model-has-constraints)                                                                   |
| `check-model-has-generic-constraints`   | Covered     | [`model-has-generic-constraints`](/docs/rules#model-has-generic-constraints)                                                   |
| `check-model-has-description`           | Covered     | [`schema-description`](/docs/rules#schema-description), [`undocumented-model`](/docs/rules#undocumented-model)                 |
| `check-model-has-meta-keys`             | Covered     | [`model-has-meta-keys`](/docs/rules#model-has-meta-keys)                                                                       |
| `check-model-has-labels-keys`           | Covered     | [`model-has-labels-keys`](/docs/rules#model-has-labels-keys)                                                                   |
| `check-model-has-properties-file`       | Covered     | [`per-model-schema-yml`](/docs/rules#per-model-schema-yml)                                                                     |
| `check-model-has-tests-by-name`         | Covered     | [`model-has-tests-by-name`](/docs/rules#model-has-tests-by-name)                                                               |
| `check-model-has-tests-by-type`         | Covered     | [`model-has-tests-by-type`](/docs/rules#model-has-tests-by-type)                                                               |
| `check-model-has-tests-by-group`        | Covered     | [`model-has-tests-by-group`](/docs/rules#model-has-tests-by-group)                                                             |
| `check-model-has-tests`                 | Covered     | [`model-has-tests`](/docs/rules#model-has-tests)                                                                               |
| `check-model-name-contract`             | Covered     | [`model-name-contract`](/docs/rules#model-name-contract)                                                                       |
| `check-model-parents-and-childs`        | Not planned | —                                                                                                                              | Rare hook; fanout rules cover similar intent. Request if you rely on min/max child counts                                                               |
| `check-model-parents-database`          | Covered     | [`model-parents-database`](/docs/rules#model-parents-database)                                                                 |
| `check-model-parents-name-prefix`       | Covered     | [`model-parents-name-prefix`](/docs/rules#model-parents-name-prefix)                                                           |
| `check-model-parents-schema`            | Covered     | [`model-parents-schema`](/docs/rules#model-parents-schema)                                                                     |
| `check-model-tags`                      | Covered     | [`model-tags`](/docs/rules#model-tags)                                                                                         |
| `check-model-materialization-by-childs` | Covered     | [`model-materialization-by-childs`](/docs/rules#model-materialization-by-childs)                                               |
| `check-script-semicolon`                | Partial     | [`script-semicolon`](/docs/rules#script-semicolon)                                                                             | **Opposite default:** checkpoint forbids trailing `;`; dbt-doctor/SQLFluff `convention.terminator` encourage it. Configure severity or disable one tool |
| `check-script-has-no-table-name`        | Partial     | [`hardcoded-database`](/docs/rules#hardcoded-database), [`prefer-ref-over-raw-source`](/docs/rules#prefer-ref-over-raw-source) | No raw table names — heuristic, not full macro graph                                                                                                    |
| `check-script-ref-and-source`           | Not planned | —                                                                                                                              | Needs compiled manifest ref resolution; partial via manifest package later                                                                              |
| `check-source-columns-have-desc`        | Partial     | [`column-description-required`](/docs/rules#column-description-required)                                                       | On models; source column docs via [`undocumented-sources`](/docs/rules#undocumented-sources)                                                            |
| `check-source-has-all-columns`          | Not planned | —                                                                                                                              | Needs catalog; see dbt-coverage                                                                                                                         |
| `check-source-has-description`          | Partial     | [`undocumented-sources`](/docs/rules#undocumented-sources)                                                                     | Source-level, not identical                                                                                                                             |
| `check-source-table-has-description`    | Not planned | —                                                                                                                              | Table-level source docs — low priority vs [`undocumented-sources`](/docs/rules#undocumented-sources)                                                    |
| `check-source-has-freshness`            | Covered     | [`source-freshness`](/docs/rules#source-freshness)                                                                             |
| `check-source-has-loader`               | Covered     | [`source-has-loader`](/docs/rules#source-has-loader)                                                                           |
| `check-source-has-meta-keys`            | Covered     | [`source-has-meta-keys`](/docs/rules#source-has-meta-keys)                                                                     |
| `check-source-has-labels-keys`          | Covered     | [`source-has-labels-keys`](/docs/rules#source-has-labels-keys)                                                                 |
| `check-source-has-tests-by-name`        | Not planned | —                                                                                                                              | Use [`required-tests-met`](/docs/rules#required-tests-met) on `sources:` paths instead                                                                  |
| `check-source-has-tests-by-type`        | Not planned | —                                                                                                                              | Same                                                                                                                                                    |
| `check-source-has-tests`                | Not planned | —                                                                                                                              | Same                                                                                                                                                    |
| `check-source-has-tests-by-group`       | Not planned | —                                                                                                                              | Same                                                                                                                                                    |
| `check-source-tags`                     | Covered     | [`source-tags`](/docs/rules#source-tags)                                                                                       |
| `check-source-childs`                   | Covered     | [`source-childs`](/docs/rules#source-childs)                                                                                   |
| `check-macro-has-description`           | Covered     | [`macro-documented`](/docs/rules#macro-documented)                                                                             |
| `check-macro-arguments-have-desc`       | Covered     | [`macro-arguments-have-desc`](/docs/rules#macro-arguments-have-desc)                                                           |
| `check-macro-has-meta-keys`             | Not planned | —                                                                                                                              | Add if requested; macros already have [`macro-documented`](/docs/rules#macro-documented)                                                                |
| `check-exposure-has-meta-keys`          | Covered     | [`exposure-has-meta-keys`](/docs/rules#exposure-has-meta-keys)                                                                 |
| `check-seed-has-meta-keys`              | Covered     | [`seed-has-meta-keys`](/docs/rules#seed-has-meta-keys)                                                                         |
| `check-snapshot-has-meta-keys`          | Covered     | [`snapshot-has-meta-keys`](/docs/rules#snapshot-has-meta-keys)                                                                 |
| `check-test-has-meta-keys`              | Covered     | [`test-has-meta-keys`](/docs/rules#test-has-meta-keys)                                                                         |
| `check-database-casing-consistency`     | Covered     | [`database-casing-consistency`](/docs/rules#database-casing-consistency)                                                       |

## Out of scope (by design)

| dbt-checkpoint feature                                                                                        | Why not in dbt-doctor                                                                             |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **Modifiers** (`generate-model-properties-file`, `unify-column-description`, `replace-script-table-names`, …) | Auto-fix / codegen is intentionally out of scope; dbt-doctor is lint-focused                      |
| **dbt command hooks** (`dbt-parse`, `dbt-run`, `dbt-test`, …)                                                 | Run dbt directly in CI; dbt-doctor does not wrap the CLI                                          |
| pre-commit framework                                                                                          | dbt-doctor ships its own CLI + GitHub Action; use pre-commit only to call `dbt-doctor` if desired |

## Configuration example

```ini
rules.model-has-tests-by-name.unique=1
rules.model-has-tests-by-name.not_null=1
rules.model-tags.allowed=daily,hourly,nightly
rules.model-has-meta-keys.required=owner,team
rules.model-name-contract.pattern=^(stg|int|fct|dim)_[a-z0-9_]+$
```

Full option list: [Rules reference](/docs/rules).
