# SQLFluff

[SQLFluff](https://docs.sqlfluff.com/) is a Python SQL linter and formatter with **73 rule codes** in the stable bundle (aliasing, layout, capitalisation, structure, jinja, references, dialect-specific). dbt-doctor is building a **native CST** path (Phase 5) and keeps SQLFluff as an **opt-in subprocess** until parity is high.

**Coverage: 39.73%** native (29 / 73 bundle codes; **100%** of tracked layout/style codes). **100%** with `--use-sqlfluff`.

[← Tool parity](/docs/tool-parity)

## Strategy

| Mode                            | When to use                                                                                                                                                 |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Native** (default)            | No Python; fast; dbt-aware rules ([`no-select-star`](/docs/rules#no-select-star), [`staging-no-join`](/docs/rules#staging-no-join), comma layout, keywords) |
| **SQLFluff** (`--use-sqlfluff`) | Existing `.sqlfluff` / `pyproject.toml`; templating errors; full layout bundle                                                                              |
| **Both**                        | Transition period; native rules dedupe where possible                                                                                                       |

```bash
# Native only (default)
npx dbt-doctor@latest

# Opt into SQLFluff
npx dbt-doctor@latest --use-sqlfluff
pip install sqlfluff sqlfluff-templater-dbt
```

## Upstream rule inventory (73 codes)

From the [SQLFluff rule index](https://docs.sqlfluff.com/en/stable/reference/rules.html) (May 2026).

| Bundle         | Codes     | Count |
| -------------- | --------- | ----: |
| Aliasing       | AL01–AL10 |    10 |
| Ambiguous      | AM01–AM09 |     9 |
| Capitalisation | CP01–CP05 |     5 |
| Convention     | CV01–CV12 |    12 |
| Jinja          | JJ01      |     1 |
| Layout         | LT01–LT15 |    15 |
| Oracle         | OR01      |     1 |
| References     | RF01–RF06 |     6 |
| Structure      | ST01–ST12 |    12 |
| TSQL           | TQ01–TQ03 |     3 |

## Native parity map (tracked SQLFluff codes)

From [`sqlfluff-parity.json`](https://github.com/joachimhodana/dbt-doctor/blob/main/packages/dbt-doctor-rules/sqlfluff-parity.json) (updated 2026-05-23).

| SQLFluff | Status  | dbt-doctor rule(s)                                                                                                                                                                     |
| -------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `LT01`   | Covered | [`sql-trailing-whitespace`](/docs/rules#sql-trailing-whitespace)                                                                                                                       |
| `LT02`   | Covered | [`sql-indentation-consistency`](/docs/rules#sql-indentation-consistency)                                                                                                               |
| `LT03`   | Covered | [`sql-operator-spacing`](/docs/rules#sql-operator-spacing)                                                                                                                             |
| `LT04`   | Covered | [`sql-leading-commas`](/docs/rules#sql-leading-commas), [`sql-trailing-commas`](/docs/rules#sql-trailing-commas), [`sql-select-trailing-comma`](/docs/rules#sql-select-trailing-comma) |
| `LT05`   | Covered | [`model-line-length`](/docs/rules#model-line-length)                                                                                                                                   |
| `LT06`   | Covered | [`sql-function-spacing`](/docs/rules#sql-function-spacing)                                                                                                                             |
| `LT07`   | Covered | [`sql-cte-bracket-position`](/docs/rules#sql-cte-bracket-position)                                                                                                                     |
| `LT08`   | Covered | [`sql-cte-blank-line-after`](/docs/rules#sql-cte-blank-line-after)                                                                                                                     |
| `LT09`   | Covered | [`sql-select-targets-layout`](/docs/rules#sql-select-targets-layout)                                                                                                                   |
| `LT10`   | Covered | [`sql-keywords-case`](/docs/rules#sql-keywords-case)                                                                                                                                   |
| `LT11`   | Covered | [`sql-set-operator-newline`](/docs/rules#sql-set-operator-newline)                                                                                                                     |
| `LT12`   | Covered | [`sql-file-trailing-newline`](/docs/rules#sql-file-trailing-newline)                                                                                                                   |
| `LT13`   | Covered | [`sql-no-leading-whitespace`](/docs/rules#sql-no-leading-whitespace)                                                                                                                   |
| `CP01`   | Covered | [`sql-keywords-case`](/docs/rules#sql-keywords-case)                                                                                                                                   |
| `CP02`   | Covered | [`sql-unquoted-identifiers-case`](/docs/rules#sql-unquoted-identifiers-case)                                                                                                           |
| `CP03`   | Covered | [`sql-function-name-case`](/docs/rules#sql-function-name-case)                                                                                                                         |
| `CP04`   | Covered | [`sql-boolean-null-case`](/docs/rules#sql-boolean-null-case)                                                                                                                           |
| `RF02`   | Covered | [`sql-references-qualified`](/docs/rules#sql-references-qualified)                                                                                                                     |
| `RF03`   | Covered | [`sql-reference-consistency`](/docs/rules#sql-reference-consistency)                                                                                                                   |
| `AL01`   | Covered | [`sql-explicit-table-alias`](/docs/rules#sql-explicit-table-alias)                                                                                                                     |
| `AL02`   | Covered | [`sql-explicit-column-alias`](/docs/rules#sql-explicit-column-alias)                                                                                                                   |
| `AM01`   | Covered | [`sql-ambiguous-distinct-group-by`](/docs/rules#sql-ambiguous-distinct-group-by)                                                                                                       |
| `AM02`   | Covered | [`sql-union-explicit-qualifier`](/docs/rules#sql-union-explicit-qualifier)                                                                                                             |
| `AM03`   | Covered | [`sql-order-by-direction-consistency`](/docs/rules#sql-order-by-direction-consistency)                                                                                                 |
| `ST01`   | Covered | [`no-select-star`](/docs/rules#no-select-star)                                                                                                                                         |
| `ST02`   | Covered | [`sql-simple-case-preferred`](/docs/rules#sql-simple-case-preferred)                                                                                                                   |
| `ST03`   | Covered | [`sql-unused-cte`](/docs/rules#sql-unused-cte)                                                                                                                                         |
| `ST04`   | Covered | [`sql-case-nesting`](/docs/rules#sql-case-nesting)                                                                                                                                     |
| `CV03`   | Covered | [`sql-select-trailing-comma`](/docs/rules#sql-select-trailing-comma)                                                                                                                   |

## dbt-specific SQL (not SQLFluff)

These are **dbt-doctor** rules, not SQLFluff bundles:

| Rule                                                         | Purpose                         |
| ------------------------------------------------------------ | ------------------------------- |
| [`no-select-star`](/docs/rules#no-select-star)               | Ban `SELECT *` in models        |
| [`staging-no-join`](/docs/rules#staging-no-join)             | No joins in staging layer paths |
| [`excessive-cte-depth`](/docs/rules#excessive-cte-depth)     | Limit `WITH` chain depth        |
| [`no-run-query-in-model`](/docs/rules#no-run-query-in-model) | Ban `run_query()`               |
| [`source-in-downstream`](/docs/rules#source-in-downstream)   | `source()` only in staging      |

## Not planned natively (and why)

| SQLFluff area                                     | Reason                                                               |
| ------------------------------------------------- | -------------------------------------------------------------------- |
| Untracked layout/dialect codes                    | Tracked LT/CP/AL/AM/ST codes have native rules — see table above     |
| **Jinja** templating (JJ01, parse errors)         | Requires SQLFluff dbt templater or compile step                      |
| **Dialect** bundles (Oracle, TSQL)                | Warehouse-specific; enable SQLFluff with dialect config              |
| Remaining bundle codes (JJ01, RF01, CV01–CV12, …) | Use `--use-sqlfluff` or wait for CST expansion                       |
| Auto-**fix** / format                             | SQLFluff `fix` is separate; dbt-doctor intentionally stays lint-only |

## Core rules shortcut

The 29 tracked codes are the layout, capitalisation, aliasing, and structure rules most teams enable first. Enabling `--use-sqlfluff` covers all 73 bundle codes via SQLFluff itself.

## Configuration

```ini
# Prefer native SQL style only
skip_sqlfluff=true

# Adopt existing SQLFluff config when opt-in
adopt_existing_sqlfluff_config=true
use_sqlfluff=true
```

Respects `.sqlfluff` and `[tool.sqlfluff]` in `pyproject.toml` when `adoptExistingSqlfluffConfig` is true.
