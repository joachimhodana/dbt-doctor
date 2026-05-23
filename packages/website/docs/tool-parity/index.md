# Tool parity

dbt-doctor aims to be the **single linter** for dbt projects: one `npx dbt-doctor` run that replaces the common [Python toolchain](#python-toolchain) ([SQLFluff](#sqlfluff), [dbt_project_evaluator](#dbt-project-evaluator), [dbt_meta_testing](#dbt-meta-testing), [dbt-checkpoint](#dbt-checkpoint), [dbt-score](#dbt-score), [dbt-coverage](#dbt-coverage)) with TypeScript rules, optional `manifest.json`, and no warehouse credentials for the default scan.

This section tracks **parity** with each tool: what is already covered, what is partial, and what we deliberately do not plan (and why).

## Python toolchain {#python-toolchain}

Credit and parity mapping for each upstream project:

### SQLFluff

[SQLFluff](https://docs.sqlfluff.com/) — SQL linter and formatter for dbt projects. [Parity details →](/docs/tool-parity/sqlfluff)

### dbt_project_evaluator

[dbt_project_evaluator](https://dbt-labs.github.io/dbt-project-evaluator/latest/) — dbt Labs package for DAG and governance tests via warehouse models. [Parity details →](/docs/tool-parity/dbt-project-evaluator)

### dbt_meta_testing

[dbt_meta_testing](https://hub.getdbt.com/tnightengale/dbt_meta_testing/latest/) — enforces `+required_tests` and `+required_docs` from `dbt_project.yml`. [Parity details →](/docs/tool-parity/dbt-meta-testing)

### dbt-checkpoint

[dbt-checkpoint](https://github.com/dbt-checkpoint/dbt-checkpoint) — pre-commit hooks for model metadata, sources, and SQL scripts. [Parity details →](/docs/tool-parity/dbt-checkpoint)

### dbt-score

[dbt-score](https://dbt-score.picnic.tech/) — Picnic metadata linter with per-entity scores. [Parity details →](/docs/tool-parity/dbt-score)

### dbt-coverage

[dbt-coverage](https://github.com/slidoapp/dbt-coverage) — documentation and test coverage from manifest + catalog. [Parity details →](/docs/tool-parity/dbt-coverage)

## Why consolidate

| Pain today | dbt-doctor direction |
| ---------- | -------------------- |
| Python + Node in CI | Node-only default; SQLFluff opt-in via `--use-sqlfluff` |
| `dbt build` / warehouse for governance | File + manifest checks; warehouse only when you need catalog columns |
| Five configs (`.sqlfluff`, pre-commit, evaluator, score, coverage) | One `.dbt-doctor` |
| Scattered diagnostics | One score, one JSON report, GitHub Action annotations |

## Overall coverage (2026-05-23)

Scores are **capability parity**, not line-for-line clones. We count each upstream check or rule family as **Covered** (1.0), **Partial** (0.5), or **Not planned** (0.0), then average.

| Tool | Upstream surface | Coverage | dbt-doctor rules today |
| ---- | ---------------- | -------: | ---------------------- |
| [dbt_project_evaluator](/docs/tool-parity/dbt-project-evaluator) | 29 warehouse fact models | **79.31%** | Manifest DAG rules + file-based architecture |
| [dbt_meta_testing](/docs/tool-parity/dbt-meta-testing) | 3 config macros | **83.33%** | `required-*-met` rules (file-based) |
| [dbt-checkpoint](/docs/tool-parity/dbt-checkpoint) | 48 lint hooks | **75%** | Configurable meta/tests/contracts |
| [dbt-score](/docs/tool-parity/dbt-score) | 14 generic rules + scoring | **75%** | Metadata + snapshot/incremental hygiene |
| [dbt-coverage](/docs/tool-parity/dbt-coverage) | 8 CLI features | **18.75%** | `--coverage` (file-based); catalog compare later |
| [SQLFluff](/docs/tool-parity/sqlfluff) | 73 rule codes (stable bundle) | **39.73%** native; **100%** with `--use-sqlfluff` | 29 native SQL rules + subprocess fallback |

**Weighted average across the six tools: ~62%.** With SQLFluff subprocess enabled, SQL style is 100% for teams that keep Python in CI.

> Methodology and per-item tables live on each tool page. Every **dbt-doctor rule** in the parity tables links to the [Rules reference](/docs/rules). Counts are updated when rules ship; [`RULES.md`](https://github.com/joachimhodana/dbt-doctor/blob/main/packages/dbt-doctor-rules/RULES.md) in the repo is the maintainer catalog.

## How dbt-doctor is layered

```text
Layer 1 — Files (always)     SQL, YAML, Jinja, seeds, macros, snapshots
Layer 2 — Manifest (opt-in)  target/manifest.json — DAG, parents, fanout
Layer 3 — SQL engine         Native CST rules (default) OR SQLFluff (--use-sqlfluff)
Layer 4 — Metrics            --coverage, --show-per-model-scores, fail thresholds
```

## Tool pages

- [dbt_project_evaluator](/docs/tool-parity/dbt-project-evaluator) — dbt Labs DAG / governance tests
- [dbt_meta_testing](/docs/tool-parity/dbt-meta-testing) — `+required_tests` / `+required_docs` in `dbt_project.yml`
- [dbt-checkpoint](/docs/tool-parity/dbt-checkpoint) — pre-commit hooks for metadata and scripts
- [dbt-score](/docs/tool-parity/dbt-score) — Picnic metadata linter and per-entity scores
- [dbt-coverage](/docs/tool-parity/dbt-coverage) — docs/test coverage from manifest + catalog
- [SQLFluff](/docs/tool-parity/sqlfluff) — SQL layout, templating, dialect lint

## What dbt-doctor adds beyond these tools

- **Health score** (0–100) and GitHub Action with annotations
- **dbt Labs layer guide** opinions (staging/marts naming, `source()` placement) beyond evaluator defaults
- **Adapter hints** (e.g. BigQuery partition / cluster) without running queries
- **Zero Python** path for architecture + metadata + native SQL style

## References

- [dbt-doctor rules catalog (repo)](https://github.com/joachimhodana/dbt-doctor/blob/main/packages/dbt-doctor-rules/RULES.md)
- [dbt_project_evaluator rules](https://dbt-labs.github.io/dbt-project-evaluator/latest/rules/)
- [dbt-checkpoint hooks](https://github.com/dbt-checkpoint/dbt-checkpoint/blob/main/README.md)
- [dbt-score](https://dbt-score.picnic.tech/)
- [dbt-coverage](https://github.com/slidoapp/dbt-coverage)
- [SQLFluff rules](https://docs.sqlfluff.com/en/stable/reference/rules.html)
