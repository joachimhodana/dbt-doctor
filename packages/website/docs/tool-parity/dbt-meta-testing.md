# dbt_meta_testing

[dbt_meta_testing](https://hub.getdbt.com/tnightengale/dbt_meta_testing/latest/) enforces **`+required_tests`**, **`+required_docs`**, and related config from `dbt_project.yml` via `dbt run-operation` (compiled project + warehouse for column discovery on `required_docs`).

**Coverage: 83.33%** (2 covered, 1 partial, 0 not planned) of 3 upstream checks.

[← Tool parity](/docs/tool-parity)

## Upstream surface

| Capability | How it works in meta-testing |
| ---------- | ---------------------------- |
| `required_tests` | Dict of regex → minimum count per model path; `dbt run-operation required_tests` |
| `required_docs` | Boolean per path; validates model + column docs via **warehouse** `get_columns_in_relation` |
| Path-level enforcement | dbt config hierarchy (`dbt_project.yml` overrides per model) |

Example from upstream docs:

```yaml
models:
  my_project:
    marts:
      +meta:
        required_tests: {"unique.*|not_null": 1}
        required_docs: true
```

## Parity map

| meta-testing capability | Status | dbt-doctor rule | Notes |
| ----------------------- | ------ | --------------- | ----- |
| `required_tests` (regex → min count) | Covered | [`required-tests-met`](/docs/rules#required-tests-met) | Reads `+required_tests` / `meta.required_tests` from `dbt_project.yml` and schema YAML — **no warehouse** |
| `required_docs` (model + columns) | Partial | [`required-docs-met`](/docs/rules#required-docs-met) | File-based: model description + column entries in YAML. Does **not** query warehouse for undeclared columns |
| `required_tags` (community pattern) | Covered | [`required-tags-met`](/docs/rules#required-tags-met) | Extension beyond stock meta-testing; same path-level config style |

## Related rules (overlap, not 1:1)

These approximate common meta-testing defaults but do not read `+required_*` keys:

- [`model-has-tests`](/docs/rules#model-has-tests), [`model-has-tests-by-name`](/docs/rules#model-has-tests-by-name), [`model-has-tests-by-type`](/docs/rules#model-has-tests-by-type), [`model-has-tests-by-group`](/docs/rules#model-has-tests-by-group)
- [`schema-description`](/docs/rules#schema-description), [`undocumented-model`](/docs/rules#undocumented-model), [`column-description-required`](/docs/rules#column-description-required)
- [`generic-test-present`](/docs/rules#generic-test-present), [`not-null-on-required-keys`](/docs/rules#not-null-on-required-keys), [`relationship-test-on-fk`](/docs/rules#relationship-test-on-fk)

## Not planned (and why)

| Gap | Reason |
| --- | ------ |
| Warehouse column discovery for `required_docs` | Conflicts with zero-warehouse CI goal. Use `dbt run-operation required_docs` on nightly jobs, or add optional `catalog.json` support later |
| `run-operation` as the only interface | dbt-doctor is a standalone CLI / Action, not a dbt package macro |
| Ephemeral model exclusion via adapter | File-based rules skip ephemeral models where detectable from config |

## Migration

Replace nightly meta-testing with:

```ini
# .dbt-doctor
rules.required-tests-met.severity=error
rules.required-docs-met.severity=error
```

Keep meta-testing in production deploy pipelines if you require **live warehouse columns** in doc checks.
