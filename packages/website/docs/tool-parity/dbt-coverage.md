# dbt-coverage

[dbt-coverage](https://github.com/slidoapp/dbt-coverage) reports documentation and test coverage with manifest/catalog artifacts.

**Coverage: 50%** (0 covered, 2 partial, 0 not planned) of 2 upstream checks.

[← Tool parity](/docs/tool-parity)

## Parity map

| Upstream feature              | Status  | dbt-doctor equivalent             | Use/notes                                      |
| ----------------------------- | ------- | --------------------------------- | ---------------------------------------------- |
| Doc coverage %                | Partial | `dbt-doctor --coverage`           | Model-level YAML coverage (no catalog columns) |
| Test coverage %               | Partial | `dbt-doctor --coverage`           | Model-level test presence                      |
| JSON export                   | Planned | `dbt-doctor --json` today         | Dedicated coverage JSON planned                |
| Path filters                  | Planned | include/ignore path controls      | Dedicated coverage filter flags planned        |
| Markdown output               | Planned | PR tooling via JSON               | Native markdown coverage report planned        |
| Coverage threshold flag       | Planned | health score gates exist          | dedicated coverage threshold planned           |
| Compare mode                  | Planned | none today                        | compare snapshots + regression gates planned   |
| Catalog-based column coverage | Planned | optional catalog path not default | keep default no-warehouse workflow             |
