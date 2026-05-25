# SQLFluff

[SQLFluff](https://docs.sqlfluff.com/) is a Python SQL linter/formatter with 74 stable bundle rule codes.

**Coverage: 100%** (74 covered, 0 partial, 0 not planned) of 74 upstream checks.

[← Tool parity](/docs/tool-parity)

## Parity map

| SQLFluff code | Status | dbt-doctor rule(s) |
| --- | --- | --- |
| `AL01` | Covered | [`sql-explicit-table-alias`](/docs/rules#sql-explicit-table-alias) |
| `AL02` | Covered | [`sql-explicit-column-alias`](/docs/rules#sql-explicit-column-alias) |
| `AL03` | Covered | [`sql-expression-alias-required`](/docs/rules#sql-expression-alias-required) |
| `AL04` | Covered | [`sql-unique-table-aliases`](/docs/rules#sql-unique-table-aliases) |
| `AL05` | Covered | [`sql-no-self-alias`](/docs/rules#sql-no-self-alias) |
| `AL06` | Covered | [`sql-alias-length-min`](/docs/rules#sql-alias-length-min) |
| `AL07` | Covered | [`sql-self-join-alias-distinct`](/docs/rules#sql-self-join-alias-distinct) |
| `AL08` | Covered | [`sql-unique-column-aliases`](/docs/rules#sql-unique-column-aliases) |
| `AL09` | Covered | [`sql-alias-not-keyword`](/docs/rules#sql-alias-not-keyword) |
| `AL10` | Covered | [`sql-derived-table-alias-required`](/docs/rules#sql-derived-table-alias-required) |
| `AM01` | Covered | [`sql-ambiguous-distinct-group-by`](/docs/rules#sql-ambiguous-distinct-group-by) |
| `AM02` | Covered | [`sql-union-explicit-qualifier`](/docs/rules#sql-union-explicit-qualifier) |
| `AM03` | Covered | [`sql-order-by-direction-consistency`](/docs/rules#sql-order-by-direction-consistency) |
| `AM04` | Covered | [`sql-no-positional-group-order`](/docs/rules#sql-no-positional-group-order) |
| `AM05` | Covered | [`sql-ambiguous-join-type`](/docs/rules#sql-ambiguous-join-type) |
| `AM06` | Covered | [`sql-ambiguous-order-by-target`](/docs/rules#sql-ambiguous-order-by-target) |
| `AM07` | Covered | [`sql-set-operator-column-count-match`](/docs/rules#sql-set-operator-column-count-match) |
| `AM08` | Covered | [`sql-distinct-with-order-by-non-selected`](/docs/rules#sql-distinct-with-order-by-non-selected) |
| `AM09` | Covered | [`sql-order-by-distinct-compatibility`](/docs/rules#sql-order-by-distinct-compatibility) |
| `CP01` | Covered | [`sql-keywords-case`](/docs/rules#sql-keywords-case) |
| `CP02` | Covered | [`sql-unquoted-identifiers-case`](/docs/rules#sql-unquoted-identifiers-case) |
| `CP03` | Covered | [`sql-function-name-case`](/docs/rules#sql-function-name-case) |
| `CP04` | Covered | [`sql-boolean-null-case`](/docs/rules#sql-boolean-null-case) |
| `CP05` | Covered | [`sql-data-type-case`](/docs/rules#sql-data-type-case) |
| `CV01` | Covered | [`sql-boolean-comparison-simplify`](/docs/rules#sql-boolean-comparison-simplify) |
| `CV02` | Covered | [`sql-no-else-null-case`](/docs/rules#sql-no-else-null-case) |
| `CV03` | Covered | [`sql-select-trailing-comma`](/docs/rules#sql-select-trailing-comma) |
| `CV04` | Covered | [`sql-count-star-preferred`](/docs/rules#sql-count-star-preferred) |
| `CV05` | Covered | [`sql-cast-style-consistency`](/docs/rules#sql-cast-style-consistency) |
| `CV06` | Covered | [`sql-null-literal-style`](/docs/rules#sql-null-literal-style) |
| `CV07` | Covered | [`sql-boolean-literal-style`](/docs/rules#sql-boolean-literal-style) |
| `CV08` | Covered | [`sql-coalesce-preferred`](/docs/rules#sql-coalesce-preferred) |
| `CV09` | Covered | [`sql-between-symmetric-style`](/docs/rules#sql-between-symmetric-style) |
| `CV10` | Covered | [`sql-quoted-literal-style`](/docs/rules#sql-quoted-literal-style) |
| `CV11` | Covered | [`sql-zero-length-string-style`](/docs/rules#sql-zero-length-string-style) |
| `CV12` | Covered | [`sql-join-condition-in-on-clause`](/docs/rules#sql-join-condition-in-on-clause) |
| `JJ01` | Covered | [`jinja-tag-padding`](/docs/rules#jinja-tag-padding), [`jinja-syntax-valid`](/docs/rules#jinja-syntax-valid) |
| `LT01` | Covered | [`sql-trailing-whitespace`](/docs/rules#sql-trailing-whitespace) |
| `LT02` | Covered | [`sql-indentation-consistency`](/docs/rules#sql-indentation-consistency) |
| `LT03` | Covered | [`sql-operator-spacing`](/docs/rules#sql-operator-spacing) |
| `LT04` | Covered | [`sql-leading-commas`](/docs/rules#sql-leading-commas), [`sql-trailing-commas`](/docs/rules#sql-trailing-commas), [`sql-select-trailing-comma`](/docs/rules#sql-select-trailing-comma) |
| `LT05` | Covered | [`model-line-length`](/docs/rules#model-line-length) |
| `LT06` | Covered | [`sql-function-spacing`](/docs/rules#sql-function-spacing) |
| `LT07` | Covered | [`sql-cte-bracket-position`](/docs/rules#sql-cte-bracket-position) |
| `LT08` | Covered | [`sql-cte-blank-line-after`](/docs/rules#sql-cte-blank-line-after) |
| `LT09` | Covered | [`sql-select-targets-layout`](/docs/rules#sql-select-targets-layout) |
| `LT10` | Covered | [`sql-keywords-case`](/docs/rules#sql-keywords-case) |
| `LT11` | Covered | [`sql-set-operator-newline`](/docs/rules#sql-set-operator-newline) |
| `LT12` | Covered | [`sql-file-trailing-newline`](/docs/rules#sql-file-trailing-newline) |
| `LT13` | Covered | [`sql-no-leading-whitespace`](/docs/rules#sql-no-leading-whitespace) |
| `LT14` | Covered | [`sql-clause-newline-consistency`](/docs/rules#sql-clause-newline-consistency) |
| `LT15` | Covered | [`sql-max-consecutive-blank-lines`](/docs/rules#sql-max-consecutive-blank-lines) |
| `OR01` | Covered | [`sql-order-by-ordinal-unambiguous`](/docs/rules#sql-order-by-ordinal-unambiguous) |
| `RF01` | Covered | [`sql-reference-object-in-from`](/docs/rules#sql-reference-object-in-from) |
| `RF02` | Covered | [`sql-references-qualified`](/docs/rules#sql-references-qualified) |
| `RF03` | Covered | [`sql-reference-consistency`](/docs/rules#sql-reference-consistency) |
| `RF04` | Covered | [`sql-reference-keyword-quoted`](/docs/rules#sql-reference-keyword-quoted) |
| `RF05` | Covered | [`sql-reference-special-chars-quoted`](/docs/rules#sql-reference-special-chars-quoted) |
| `RF06` | Covered | [`sql-reference-unnecessary-quoted`](/docs/rules#sql-reference-unnecessary-quoted) |
| `ST01` | Covered | [`no-select-star`](/docs/rules#no-select-star) |
| `ST02` | Covered | [`sql-simple-case-preferred`](/docs/rules#sql-simple-case-preferred) |
| `ST03` | Covered | [`sql-unused-cte`](/docs/rules#sql-unused-cte) |
| `ST04` | Covered | [`sql-case-nesting`](/docs/rules#sql-case-nesting) |
| `ST05` | Covered | [`sql-no-subquery-in-join`](/docs/rules#sql-no-subquery-in-join) |
| `ST06` | Covered | [`sql-single-statement-model`](/docs/rules#sql-single-statement-model) |
| `ST07` | Covered | [`sql-join-condition-required`](/docs/rules#sql-join-condition-required) |
| `ST08` | Covered | [`sql-distinct-parentheses`](/docs/rules#sql-distinct-parentheses) |
| `ST09` | Covered | [`sql-join-using-consistency`](/docs/rules#sql-join-using-consistency) |
| `ST10` | Covered | [`sql-constant-expression`](/docs/rules#sql-constant-expression) |
| `ST11` | Covered | [`sql-unused-join-alias`](/docs/rules#sql-unused-join-alias) |
| `ST12` | Covered | [`sql-no-consecutive-semicolons`](/docs/rules#sql-no-consecutive-semicolons) |
| `TQ01` | Covered | [`sql-tsql-sp-prefix`](/docs/rules#sql-tsql-sp-prefix) |
| `TQ02` | Covered | [`sql-tsql-bare-temp-table`](/docs/rules#sql-tsql-bare-temp-table) |
| `TQ03` | Covered | [`sql-tsql-sys-schema-qualified`](/docs/rules#sql-tsql-sys-schema-qualified) |

## Recommended usage

| Mode | Use |
| --- | --- |
| Native default | Fast no-Python SQL linting |
| `--use-sqlfluff` | Full SQLFluff parity now |
| Both | Migration period |

```bash
npx dbt-doctor@latest
npx dbt-doctor@latest --use-sqlfluff
```
