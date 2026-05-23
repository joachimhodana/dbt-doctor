# dbt-score

[dbt-score](https://dbt-score.picnic.tech/) (Picnic) lints **dbt metadata** from `manifest.json`, scores each entity 0–10, and supports custom Python rules. dbt-doctor provides **equivalent generic checks** as file/manifest rules plus a **project health score** (0–100).

**Coverage: 75%** (9 covered, 3 partial, 2 not planned) of 14 upstream checks.

[← Tool parity](/docs/tool-parity)

## Upstream generic rules (14)

Scraped from [`dbt_score/rules/generic.py`](https://github.com/PicnicSupermarket/dbt-score/blob/master/src/dbt_score/rules/generic.py) (May 2026).

| Rule ID | What it checks |
| ------- | -------------- |
| `has_description` | Model has non-empty description |
| `columns_have_description` | Every column documented |
| `has_owner` | `meta.owner` present |
| `sql_has_reasonable_number_of_lines` | SQL length ≤ threshold (default 200) |
| `has_example_sql` | Model description contains fenced ` ```sql ` example |
| `single_pk_defined_at_column_level` | Single-column PK as column constraint |
| `single_column_uniqueness_at_column_level` | `unique` on column, not model test |
| `has_uniqueness_test` | PK columns have matching uniqueness tests |
| `has_no_unused_is_incremental` | Non-incremental model must not call `is_incremental()` |
| `snapshot_has_unique_key` | Snapshot config `unique_key` |
| `snapshot_has_strategy` | Snapshot config `strategy` |
| `seed_has_description` | Seed documented |
| `seed_columns_have_description` | Seed columns documented |
| `seed_has_owner` | Seed `meta.owner` |

dbt-score also lints **sources, exposures, snapshots** with additional packaged rules; most map to dbt-doctor `*-documented`, `*-has-meta-keys`, and exposure rules.

## Parity map

| dbt-score rule | Status | dbt-doctor rule(s) |
| -------------- | ------ | ------------------ |
| `has_description` | Covered | [`schema-description`](/docs/rules#schema-description), [`undocumented-model`](/docs/rules#undocumented-model) |
| `columns_have_description` | Covered | [`column-description-required`](/docs/rules#column-description-required) |
| `has_owner` | Covered | [`model-owner-or-meta`](/docs/rules#model-owner-or-meta), [`seed-has-owner`](/docs/rules#seed-has-owner) |
| `sql_has_reasonable_number_of_lines` | Covered | [`model-line-length`](/docs/rules#model-line-length) (default 120; configurable) |
| `has_example_sql` | Not planned | — | Niche doc-style rule; teams enforce via custom rule or docs template |
| `single_pk_defined_at_column_level` | Partial | [`model-has-constraints`](/docs/rules#model-has-constraints) | Validates constraints exist, not PK placement style |
| `single_column_uniqueness_at_column_level` | Not planned | — | Highly opinionated dbt v1.5+ contracts feature; use [`model-has-generic-constraints`](/docs/rules#model-has-generic-constraints) |
| `has_uniqueness_test` | Partial | [`generic-test-present`](/docs/rules#generic-test-present), [`not-null-on-required-keys`](/docs/rules#not-null-on-required-keys) | Heuristic on `id` / `*_id` columns |
| `has_no_unused_is_incremental` | Covered | [`no-unused-is-incremental`](/docs/rules#no-unused-is-incremental) |
| `snapshot_has_unique_key` | Covered | [`snapshot-unique-key`](/docs/rules#snapshot-unique-key) |
| `snapshot_has_strategy` | Covered | [`snapshot-strategy`](/docs/rules#snapshot-strategy) |
| `seed_has_description` | Covered | [`seed-documented`](/docs/rules#seed-documented) |
| `seed_columns_have_description` | Partial | [`seed-documented`](/docs/rules#seed-documented), [`column-description-required`](/docs/rules#column-description-required) | No seed-only column sweep |
| `seed_has_owner` | Covered | [`seed-has-owner`](/docs/rules#seed-has-owner) |

## Platform features

| Feature | dbt-score | dbt-doctor |
| ------- | --------- | ---------- |
| Per-model score 0–10 | Yes | Yes — `dbt-doctor --show-per-model-scores` (0–100 scale) |
| `fail_project_under` / `fail_any_item_under` | Yes | Yes — `failProjectUnder`, `failAnyItemUnder` in config |
| Custom rules (Python) | Yes | Yes — TypeScript `DbtDoctorPlugin` |
| Project score + medals | Yes | Yes — health score + label |
| Badges / score history API | Yes | Not planned — use your CI artifact or leaderboard replacement |
| Requires `manifest.json` | Yes | Optional; file rules run without it |

## Not planned (and why)

| Gap | Reason |
| --- | ------ |
| `has_example_sql` | Documentation style preference, not data quality |
| `single_column_uniqueness_at_column_level` | Conflicts with common `unique` + `not_null` column test patterns |
| Hosted badges | Out of scope for CLI; generate shields from CI JSON output if needed |

## Example

```bash
npx dbt-doctor@latest --show-per-model-scores --fail-any-item-under 70
```
