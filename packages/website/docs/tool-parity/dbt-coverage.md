# dbt-coverage

[dbt-coverage](https://github.com/slidoapp/dbt-coverage) reports **documentation** and **test** coverage per model from `target/manifest.json` and `target/catalog.json`, with `compute` and `compare` commands for CI gates.

**Coverage: 18.75%** (0 covered, 3 partial, 5 not planned) of 8 upstream checks.

[← Tool parity](/docs/tool-parity)

## Upstream feature inventory

Scraped from the [dbt-coverage README](https://github.com/slidoapp/dbt-coverage/blob/main/README.md) (May 2026).

| Feature                | Command / flag                  | Purpose                         |
| ---------------------- | ------------------------------- | ------------------------------- |
| Doc coverage report    | `dbt-coverage compute doc`      | % columns documented per model  |
| Test coverage report   | `dbt-coverage compute test`     | % columns with tests per model  |
| JSON report export     | `--cov-report`                  | Write machine-readable coverage |
| Path filter            | `--model-path-filter`           | Limit to subtree                |
| Path exclusion         | `--model-path-exclusion-filter` | Exclude subtree                 |
| Markdown table output  | `--cov-format markdown`         | PR comments                     |
| Custom artifacts dir   | `--run-artifacts-dir`           | Non-default `target/`           |
| Fail under threshold   | `--cov-fail-under`              | CI gate on %                    |
| Compare two runs       | `dbt-coverage compare`          | Delta between JSON reports      |
| Fail if coverage drops | `--cov-fail-compare`            | Regression gate vs baseline     |

**Requires:** `dbt run` + `dbt docs generate` (catalog for column-level doc/test counts).

## Parity map

| dbt-coverage feature             | Status      | dbt-doctor equivalent                                                      |
| -------------------------------- | ----------- | -------------------------------------------------------------------------- |
| Doc coverage %                   | Partial     | `dbt-doctor --coverage` — **model-level** % from YAML (no catalog columns) |
| Test coverage %                  | Partial     | Same — models with ≥1 test in schema YAML                                  |
| JSON export                      | Not planned | Use `dbt-doctor --json` diagnostics; dedicated coverage JSON later         |
| `--model-path-filter`            | Not planned | Use `includePaths` / `.dbt-doctor` ignore patterns                         |
| `--cov-format markdown`          | Not planned | Pipe `--json` into your PR bot                                             |
| `--cov-fail-under`               | Not planned | Use `failProjectUnder` on health score; coverage thresholds TBD            |
| `compare` / `--cov-fail-compare` | Partial     | `writeBaseline` / `baseline` — score regression, not column-level delta    |
| Catalog-based column coverage    | Not planned | Needs `catalog.json`; file-only philosophy for default CI                  |

## What `--coverage` does today

```bash
npx dbt-doctor@latest --coverage
# Coverage: tests 67% (12/18) • docs 82% (15/18)
```

- **Docs %:** share of `.sql` models with a non-empty `description` in schema YAML
- **Tests %:** share of models with at least one test reference in YAML
- Does **not** require warehouse or catalog

## Not planned (and why)

| Gap                    | Reason                                                                                                                     |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Column-level coverage  | Requires `catalog.json` after `dbt docs generate`; conflicts with zero-warehouse default. May add opt-in `--catalog` later |
| `compare` per column   | dbt-doctor baseline tracks **project score**, not per-column doc/test matrices                                             |
| Markdown report format | CI integrations vary; JSON output is the stable contract                                                                   |

## Recommended split

| Job               | Tool                                                 |
| ----------------- | ---------------------------------------------------- |
| Every PR (fast)   | `dbt-doctor --coverage`                              |
| Nightly / release | `dbt-coverage compute` with catalog for column truth |
