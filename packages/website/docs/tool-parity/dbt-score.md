# dbt-score

[dbt-score](https://dbt-score.picnic.tech/) lints dbt metadata from `manifest.json` and scores entities.

**Coverage: 100%** (14 covered, 0 partial, 0 not planned) of 14 upstream checks.

[← Tool parity](/docs/tool-parity)

## Parity map

| Upstream check                             | Status  | dbt-doctor rule(s)                                                                                             |
| ------------------------------------------ | ------- | -------------------------------------------------------------------------------------------------------------- |
| `has_description`                          | Covered | [`schema-description`](/docs/rules#schema-description), [`undocumented-model`](/docs/rules#undocumented-model) |
| `columns_have_description`                 | Covered | [`column-description-required`](/docs/rules#column-description-required)                                       |
| `has_owner`                                | Covered | [`model-owner-or-meta`](/docs/rules#model-owner-or-meta), [`seed-has-owner`](/docs/rules#seed-has-owner)       |
| `sql_has_reasonable_number_of_lines`       | Covered | [`model-line-length`](/docs/rules#model-line-length)                                                           |
| `single_pk_defined_at_column_level`        | Covered | [`model-single-pk-column-level`](/docs/rules#model-single-pk-column-level)                                     |
| `has_uniqueness_test`                      | Covered | [`model-has-uniqueness-test`](/docs/rules#model-has-uniqueness-test)                                           |
| `seed_columns_have_description`            | Covered | [`seed-columns-have-description`](/docs/rules#seed-columns-have-description)                                   |
| `has_no_unused_is_incremental`             | Covered | [`no-unused-is-incremental`](/docs/rules#no-unused-is-incremental)                                             |
| `snapshot_has_unique_key`                  | Covered | [`snapshot-unique-key`](/docs/rules#snapshot-unique-key)                                                       |
| `snapshot_has_strategy`                    | Covered | [`snapshot-strategy`](/docs/rules#snapshot-strategy)                                                           |
| `seed_has_description`                     | Covered | [`seed-documented`](/docs/rules#seed-documented)                                                               |
| `seed_has_owner`                           | Covered | [`seed-has-owner`](/docs/rules#seed-has-owner)                                                                 |
| `has_example_sql`                          | Covered | [`model-has-example-sql`](/docs/rules#model-has-example-sql)                                                   |
| `single_column_uniqueness_at_column_level` | Covered | [`model-single-column-uniqueness`](/docs/rules#model-single-column-uniqueness)                                 |
