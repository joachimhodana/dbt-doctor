# Tool parity

dbt-doctor aims to be the **single linter** for dbt projects: one `npx dbt-doctor` run that replaces the core Python toolchain components with TypeScript rules, optional `manifest.json`, `catalog.json` and no warehouse credentials for the default scan.

## Covered tools

- [SQLFluff](/docs/tool-parity/sqlfluff)
- [dbt_meta_testing](/docs/tool-parity/dbt-meta-testing)
- [dbt-checkpoint](/docs/tool-parity/dbt-checkpoint)
- [dbt-score](/docs/tool-parity/dbt-score)
- [dbt-coverage](/docs/tool-parity/dbt-coverage)

## Overall coverage

| Tool                                                   | Upstream surface              |                                        Coverage | dbt-doctor rules today                            |
| ------------------------------------------------------ | ----------------------------- | ----------------------------------------------: | ------------------------------------------------- |
| [dbt_meta_testing](/docs/tool-parity/dbt-meta-testing) | 3 config macros               |                                        **100%** | `required-*-met` rules (file-based)               |
| [dbt-checkpoint](/docs/tool-parity/dbt-checkpoint)     | 48 lint hooks                 |                                        **100%** | Configurable meta/tests/contracts                 |
| [dbt-score](/docs/tool-parity/dbt-score)               | 14 generic rules + scoring    |                                        **100%** | Metadata + snapshot/incremental hygiene           |
| [dbt-coverage](/docs/tool-parity/dbt-coverage)         | 8 CLI features                |                                         **50%** | `--coverage` (file-based); catalog compare later  |
| [SQLFluff](/docs/tool-parity/sqlfluff)                 | 74 rule codes (stable bundle) | **100%** native; **100%** with `--use-sqlfluff` | Native SQL/Jinja parity map + subprocess fallback |

> Coverage was last updated on May 31, 2026.
>
> Average across these five tools: **90%**.

## References

- [Rules reference](/docs/rules)
- [dbt-checkpoint hooks](https://github.com/dbt-checkpoint/dbt-checkpoint/blob/main/README.md)
- [dbt-score](https://dbt-score.picnic.tech/)
- [dbt-coverage](https://github.com/slidoapp/dbt-coverage)
- [SQLFluff rules](https://docs.sqlfluff.com/en/stable/reference/rules.html)
