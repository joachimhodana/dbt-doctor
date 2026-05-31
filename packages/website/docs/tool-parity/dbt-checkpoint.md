# dbt-checkpoint

[dbt-checkpoint](https://github.com/dbt-checkpoint/dbt-checkpoint) provides pre-commit hooks for dbt metadata, tests, and SQL policy checks.

**Coverage: 100%** (48 covered, 0 partial, 0 not planned) of 48 upstream checks.

[← Tool parity](/docs/tool-parity)

## Parity map

| Upstream hook                           | Status  | dbt-doctor equivalent                                                                                          |
| --------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------- |
| `check-column-desc-are-same`            | Covered | [`column-desc-are-same`](/docs/rules#column-desc-are-same)                                                     |
| `check-column-name-contract`            | Covered | [`column-name-contract`](/docs/rules#column-name-contract)                                                     |
| `check-model-columns-have-desc`         | Covered | [`column-description-required`](/docs/rules#column-description-required)                                       |
| `check-model-columns-have-meta-keys`    | Covered | [`model-columns-have-meta-keys`](/docs/rules#model-columns-have-meta-keys)                                     |
| `check-model-has-all-columns`           | Covered | [`model-has-all-columns`](/docs/rules#model-has-all-columns)                                                   |
| `check-model-has-contract`              | Covered | [`model-contract-enforced`](/docs/rules#model-contract-enforced)                                               |
| `check-model-has-constraints`           | Covered | [`model-has-constraints`](/docs/rules#model-has-constraints)                                                   |
| `check-model-has-generic-constraints`   | Covered | [`model-has-generic-constraints`](/docs/rules#model-has-generic-constraints)                                   |
| `check-model-has-description`           | Covered | [`schema-description`](/docs/rules#schema-description), [`undocumented-model`](/docs/rules#undocumented-model) |
| `check-model-has-meta-keys`             | Covered | [`model-has-meta-keys`](/docs/rules#model-has-meta-keys)                                                       |
| `check-model-has-labels-keys`           | Covered | [`model-has-labels-keys`](/docs/rules#model-has-labels-keys)                                                   |
| `check-model-has-properties-file`       | Covered | [`per-model-schema-yml`](/docs/rules#per-model-schema-yml)                                                     |
| `check-model-has-tests-by-name`         | Covered | [`model-has-tests-by-name`](/docs/rules#model-has-tests-by-name)                                               |
| `check-model-has-tests-by-type`         | Covered | [`model-has-tests-by-type`](/docs/rules#model-has-tests-by-type)                                               |
| `check-model-has-tests-by-group`        | Covered | [`model-has-tests-by-group`](/docs/rules#model-has-tests-by-group)                                             |
| `check-model-has-tests`                 | Covered | [`model-has-tests`](/docs/rules#model-has-tests)                                                               |
| `check-model-name-contract`             | Covered | [`model-name-contract`](/docs/rules#model-name-contract)                                                       |
| `check-model-parents-and-childs`        | Covered | [`model-parents-and-childs`](/docs/rules#model-parents-and-childs)                                             |
| `check-model-parents-database`          | Covered | [`model-parents-database`](/docs/rules#model-parents-database)                                                 |
| `check-model-parents-name-prefix`       | Covered | [`model-parents-name-prefix`](/docs/rules#model-parents-name-prefix)                                           |
| `check-model-parents-schema`            | Covered | [`model-parents-schema`](/docs/rules#model-parents-schema)                                                     |
| `check-model-tags`                      | Covered | [`model-tags`](/docs/rules#model-tags)                                                                         |
| `check-model-materialization-by-childs` | Covered | [`model-materialization-by-childs`](/docs/rules#model-materialization-by-childs)                               |
| `check-script-semicolon`                | Covered | [`script-semicolon`](/docs/rules#script-semicolon)                                                             |
| `check-script-has-no-table-name`        | Covered | [`script-has-no-table-name`](/docs/rules#script-has-no-table-name)                                             |
| `check-script-ref-and-source`           | Covered | [`script-ref-and-source`](/docs/rules#script-ref-and-source)                                                   |
| `check-source-columns-have-desc`        | Covered | [`source-columns-have-desc`](/docs/rules#source-columns-have-desc)                                             |
| `check-source-has-all-columns`          | Covered | [`source-has-all-columns`](/docs/rules#source-has-all-columns)                                                 |
| `check-source-has-description`          | Covered | [`source-has-description`](/docs/rules#source-has-description)                                                 |
| `check-source-table-has-description`    | Covered | [`source-table-has-description`](/docs/rules#source-table-has-description)                                     |
| `check-source-has-freshness`            | Covered | [`source-freshness`](/docs/rules#source-freshness)                                                             |
| `check-source-has-loader`               | Covered | [`source-has-loader`](/docs/rules#source-has-loader)                                                           |
| `check-source-has-meta-keys`            | Covered | [`source-has-meta-keys`](/docs/rules#source-has-meta-keys)                                                     |
| `check-source-has-labels-keys`          | Covered | [`source-has-labels-keys`](/docs/rules#source-has-labels-keys)                                                 |
| `check-source-tags`                     | Covered | [`source-tags`](/docs/rules#source-tags)                                                                       |
| `check-source-childs`                   | Covered | [`source-childs`](/docs/rules#source-childs)                                                                   |
| `check-macro-has-description`           | Covered | [`macro-documented`](/docs/rules#macro-documented)                                                             |
| `check-macro-arguments-have-desc`       | Covered | [`macro-arguments-have-desc`](/docs/rules#macro-arguments-have-desc)                                           |
| `check-macro-has-meta-keys`             | Covered | [`macro-has-meta-keys`](/docs/rules#macro-has-meta-keys)                                                       |
| `check-exposure-has-meta-keys`          | Covered | [`exposure-has-meta-keys`](/docs/rules#exposure-has-meta-keys)                                                 |
| `check-seed-has-meta-keys`              | Covered | [`seed-has-meta-keys`](/docs/rules#seed-has-meta-keys)                                                         |
| `check-snapshot-has-meta-keys`          | Covered | [`snapshot-has-meta-keys`](/docs/rules#snapshot-has-meta-keys)                                                 |
| `check-test-has-meta-keys`              | Covered | [`test-has-meta-keys`](/docs/rules#test-has-meta-keys)                                                         |
| `check-database-casing-consistency`     | Covered | [`database-casing-consistency`](/docs/rules#database-casing-consistency)                                       |
| `check-source-has-tests-by-name`        | Covered | [`source-has-tests-by-name`](/docs/rules#source-has-tests-by-name)                                             |
| `check-source-has-tests-by-type`        | Covered | [`source-has-tests-by-type`](/docs/rules#source-has-tests-by-type)                                             |
| `check-source-has-tests`                | Covered | [`source-has-tests`](/docs/rules#source-has-tests)                                                             |
| `check-source-has-tests-by-group`       | Covered | [`source-has-tests-by-group`](/docs/rules#source-has-tests-by-group)                                           |
