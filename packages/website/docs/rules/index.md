# Rules reference

191 built-in rules. Configure severity and per-rule options in [`.dbt-doctor`](/docs/getting-started/configuration) at the repo root.

## Configuration format

```ini
# Severity: error | warn | off
rules.no-select-star=warn

# Per-rule options (nested keys)
rules.model-has-meta-keys=error
rules.model-has-meta-keys.required=owner,team
```

See [Configuration](/docs/getting-started/configuration) for a full example.

See also [Tool parity](/docs/tool-parity) for how these rules map to SQLFluff, dbt-checkpoint, dbt-score, and other tools.

## Rule index

- [Architecture](#architecture)
- [Best Practices](#best-practices)
- [Configuration](#configuration)
- [Documentation](#documentation)
- [Governance](#governance)
- [Naming](#naming)
- [Performance](#performance)
- [Sources](#sources)
- [SQL Convention](#sql-convention)
- [SQL Quality](#sql-quality)
- [SQL Style](#sql-style)
- [Structure](#structure)
- [Testing](#testing)

## Architecture {#architecture}

- [`direct-source-and-ref`](#direct-source-and-ref)
- [`hardcoded-database`](#hardcoded-database)
- [`model-fanout`](#model-fanout)
- [`model-parents-and-childs`](#model-parents-and-childs)
- [`model-parents-database`](#model-parents-database)
- [`model-parents-name-prefix`](#model-parents-name-prefix)
- [`model-parents-schema`](#model-parents-schema)
- [`multiple-sources-joined`](#multiple-sources-joined)
- [`no-run-query-in-model`](#no-run-query-in-model)
- [`prefer-ref-over-raw-source`](#prefer-ref-over-raw-source)
- [`rejoining-upstream-concepts`](#rejoining-upstream-concepts)
- [`script-has-no-table-name`](#script-has-no-table-name)
- [`script-ref-and-source`](#script-ref-and-source)
- [`source-childs`](#source-childs)
- [`source-fanout`](#source-fanout)
- [`source-in-downstream`](#source-in-downstream)
- [`staging-depends-on-downstream`](#staging-depends-on-downstream)
- [`staging-depends-on-staging`](#staging-depends-on-staging)
- [`staging-no-join`](#staging-no-join)

### direct-source-and-ref {#direct-source-and-ref}

**error** · Architecture

Do not mix {{ source() }} and {{ ref() }} in one model — stage sources first

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.direct-source-and-ref=error
```

### hardcoded-database {#hardcoded-database}

**error** · Architecture

Use {{ ref() }} and {{ source() }} instead of schema.table literals

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.hardcoded-database=error
```

### model-fanout {#model-fanout}

**warn** · Architecture

- Requires `target/manifest.json`

Very high model fanout can create brittle DAG bottlenecks.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.model-fanout=warn
```

### model-parents-and-childs {#model-parents-and-childs}

**warn** · Architecture · tags: `enterprise`

- Requires `target/manifest.json`

Set min/max parent and child thresholds to enforce model graph shape (dbt-checkpoint parity).

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.model-parents-and-childs=warn
```

### model-parents-database {#model-parents-database}

**warn** · Architecture

- Requires `target/manifest.json`

Parent model dependencies should come from expected database.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |
| `equals`   | string                     | All parents must use this database. |

Example `.dbt-doctor`:

```ini
rules.model-parents-database=warn
rules.model-parents-database.equals=analytics
```

### model-parents-name-prefix {#model-parents-name-prefix}

**warn** · Architecture

- Requires `target/manifest.json`

Parent model names should match an expected prefix.

**Configuration**

| Option     | Type                       | Description                                         |
| ---------- | -------------------------- | --------------------------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested).                 |
| `prefix`   | string                     | All parent model names must start with this prefix. |

Example `.dbt-doctor`:

```ini
rules.model-parents-name-prefix=warn
rules.model-parents-name-prefix.prefix=stg_
```

### model-parents-schema {#model-parents-schema}

**warn** · Architecture

- Requires `target/manifest.json`

Keep parent models in expected schemas/folders.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |
| `equals`   | string                     | All parents must use this schema.   |

Example `.dbt-doctor`:

```ini
rules.model-parents-schema=warn
rules.model-parents-schema.equals=staging
```

### multiple-sources-joined {#multiple-sources-joined}

**error** · Architecture

- Requires `target/manifest.json`

Joining multiple raw sources directly often belongs in intermediate models.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.multiple-sources-joined=error
```

### no-run-query-in-model {#no-run-query-in-model}

**error** · Architecture

Use refs and macros instead of run_query in models

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.no-run-query-in-model=error
```

### prefer-ref-over-raw-source {#prefer-ref-over-raw-source}

**error** · Architecture

Use {{ ref() }} for model dependencies

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.prefer-ref-over-raw-source=error
```

### rejoining-upstream-concepts {#rejoining-upstream-concepts}

**error** · Architecture

- Requires `target/manifest.json`

Avoid rejoining upstream concepts already combined earlier in the DAG.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.rejoining-upstream-concepts=error
```

### script-has-no-table-name {#script-has-no-table-name}

**warn** · Architecture · tags: `strict`

Avoid hardcoded relation names in model SQL.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.script-has-no-table-name=warn
```

### script-ref-and-source {#script-ref-and-source}

**warn** · Architecture · tags: `strict`

Reference relations with valid {{ ref() }} / {{ source() }} and call only existing macros.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.script-ref-and-source=warn
```

### source-childs {#source-childs}

**warn** · Architecture

- Requires `target/manifest.json`

Sources should have at least a minimum number of downstream models.

**Configuration**

| Option        | Type                       | Description                           |
| ------------- | -------------------------- | ------------------------------------- |
| `severity`    | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested).   |
| `minChildren` | number                     | Minimum downstream models per source. |

Example `.dbt-doctor`:

```ini
rules.source-childs=warn
rules.source-childs.minChildren=1
```

### source-fanout {#source-fanout}

**warn** · Architecture

- Requires `target/manifest.json`

High source fanout often indicates repeated transformations across many models.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.source-fanout=warn
```

### source-in-downstream {#source-in-downstream}

**error** · Architecture

Reference raw data only in staging via {{ source() }}; downstream layers use {{ ref() }}

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.source-in-downstream=error
```

### staging-depends-on-downstream {#staging-depends-on-downstream}

**error** · Architecture

- Requires `target/manifest.json`

Staging models should depend on sources, not intermediate or marts models.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.staging-depends-on-downstream=error
```

### staging-depends-on-staging {#staging-depends-on-staging}

**error** · Architecture

- Requires `target/manifest.json`

Staging models should depend on sources only. Move transformations to intermediate or marts.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.staging-depends-on-staging=error
```

### staging-no-join {#staging-no-join}

**warn** · Architecture

Avoid joins in staging; combine entities in intermediate or marts

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.staging-no-join=warn
```

## Best Practices {#best-practices}

- [`excessive-cte-depth`](#excessive-cte-depth)
- [`macro-snake-case`](#macro-snake-case)
- [`model-line-length`](#model-line-length)
- [`no-abbreviations-in-names`](#no-abbreviations-in-names)
- [`no-unused-is-incremental`](#no-unused-is-incremental)
- [`recommended-dbt-packages`](#recommended-dbt-packages)

### excessive-cte-depth {#excessive-cte-depth}

**warn** · Best Practices · tags: `enterprise`

Split models with many CTEs into intermediate models

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.excessive-cte-depth=warn
```

### macro-snake-case {#macro-snake-case}

**warn** · Best Practices · tags: `strict`

Macro names should use snake_case (lowercase letters, digits, underscores)

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.macro-snake-case=warn
```

### model-line-length {#model-line-length}

**warn** · Best Practices · tags: `style`

See the [Rules reference](/docs/rules) for configuration options.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.model-line-length=warn
```

### no-abbreviations-in-names {#no-abbreviations-in-names}

**warn** · Best Practices · tags: `strict`, `style`

Use full words in model names instead of abbreviations (e.g. architecture not arch)

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.no-abbreviations-in-names=warn
```

### no-unused-is-incremental {#no-unused-is-incremental}

**warn** · Best Practices · tags: `enterprise`

Remove is_incremental() from models that are not materialized as incremental

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.no-unused-is-incremental=warn
```

### recommended-dbt-packages {#recommended-dbt-packages}

**warn** · Best Practices · tags: `strict`

Add dbt_utils, dbt_date, and dbt_expectations (or successors) via packages.yml for standard macros and tests

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.recommended-dbt-packages=warn
```

## Configuration {#configuration}

- [`dbt-project-name`](#dbt-project-name)
- [`incremental-unique-key`](#incremental-unique-key)
- [`jinja-config-block`](#jinja-config-block)
- [`materialization-hint`](#materialization-hint)
- [`model-contract-enforced`](#model-contract-enforced)
- [`snapshot-strategy`](#snapshot-strategy)
- [`snapshot-unique-key`](#snapshot-unique-key)
- [`staging-materialized-view`](#staging-materialized-view)

### dbt-project-name {#dbt-project-name}

**error** · Configuration

Set name in dbt_project.yml

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.dbt-project-name=error
```

### incremental-unique-key {#incremental-unique-key}

**error** · Configuration · tags: `enterprise`

Incremental models must declare unique_key

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.incremental-unique-key=error
```

### jinja-config-block {#jinja-config-block}

**warn** · Configuration

Put model config in a config() block at the top of the file

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.jinja-config-block=warn
```

### materialization-hint {#materialization-hint}

**warn** · Configuration · tags: `style`

Set explicit materialization for large models

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.materialization-hint=warn
```

### model-contract-enforced {#model-contract-enforced}

**warn** · Configuration · tags: `strict`

Enable model contracts with contract.enforced: true in schema YAML

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.model-contract-enforced=warn
```

### snapshot-strategy {#snapshot-strategy}

**warn** · Configuration · tags: `enterprise`

Snapshots need strategy and updated_at or check_cols

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.snapshot-strategy=warn
```

### snapshot-unique-key {#snapshot-unique-key}

**error** · Configuration · tags: `enterprise`

Snapshots must set unique_key for deduplication

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.snapshot-unique-key=error
```

### staging-materialized-view {#staging-materialized-view}

**warn** · Configuration

Prefer view (or ephemeral) materialization for staging models

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.staging-materialized-view=warn
```

## Documentation {#documentation}

- [`column-desc-are-same`](#column-desc-are-same)
- [`column-description-required`](#column-description-required)
- [`macro-arguments-have-desc`](#macro-arguments-have-desc)
- [`macro-documented`](#macro-documented)
- [`model-has-example-sql`](#model-has-example-sql)
- [`per-model-schema-yml`](#per-model-schema-yml)
- [`required-docs-met`](#required-docs-met)
- [`schema-description`](#schema-description)
- [`seed-columns-have-description`](#seed-columns-have-description)
- [`seed-documented`](#seed-documented)
- [`source-columns-have-desc`](#source-columns-have-desc)
- [`source-has-description`](#source-has-description)
- [`source-table-has-description`](#source-table-has-description)
- [`undocumented-model`](#undocumented-model)
- [`undocumented-sources`](#undocumented-sources)

### column-desc-are-same {#column-desc-are-same}

**warn** · Documentation

Set `rules.column-desc-are-same.columns=col1,col2` to enforce consistent descriptions across models.

**Configuration**

| Option     | Type                       | Description                                                      |
| ---------- | -------------------------- | ---------------------------------------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested).                              |
| `columns`  | string[]                   | Column names that must share the same description across models. |

Example `.dbt-doctor`:

```ini
rules.column-desc-are-same=warn
rules.column-desc-are-same.columns=amount,currency
```

### column-description-required {#column-description-required}

**warn** · Documentation · tags: `enterprise`, `strict`

Document every column in schema YAML

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.column-description-required=warn
```

### macro-arguments-have-desc {#macro-arguments-have-desc}

**warn** · Documentation

Every macro argument should include a description in macros YAML.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |
| `enabled`  | boolean                    | Opt-in rule.                        |

Example `.dbt-doctor`:

```ini
rules.macro-arguments-have-desc=warn
rules.macro-arguments-have-desc.enabled=true
```

### macro-documented {#macro-documented}

**warn** · Documentation · tags: `strict`

Document every macro in macros/\*.yml with a description

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.macro-documented=warn
```

### model-has-example-sql {#model-has-example-sql}

**warn** · Documentation · tags: `strict`

Model metadata should include an example_sql snippet.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.model-has-example-sql=warn
```

### per-model-schema-yml {#per-model-schema-yml}

**warn** · Documentation · tags: `strict`

Add a schema YAML file named after each model (e.g. stg_orders.yml for stg_orders.sql)

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.per-model-schema-yml=warn
```

### required-docs-met {#required-docs-met}

**warn** · Documentation · tags: `strict`

Satisfy +required_docs from dbt_project.yml by documenting model and column descriptions.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.required-docs-met=warn
```

### schema-description {#schema-description}

**warn** · Documentation

Add descriptions to models and columns in schema.yml

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.schema-description=warn
```

### seed-columns-have-description {#seed-columns-have-description}

**warn** · Documentation · tags: `strict`

Seed columns should include descriptions.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.seed-columns-have-description=warn
```

### seed-documented {#seed-documented}

**warn** · Documentation · tags: `strict`

Document every seed in YAML with a description

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.seed-documented=warn
```

### source-columns-have-desc {#source-columns-have-desc}

**warn** · Documentation · tags: `strict`

Describe every column on every source table.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.source-columns-have-desc=warn
```

### source-has-description {#source-has-description}

**warn** · Documentation · tags: `strict`

Document each source definition with a non-empty description.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.source-has-description=warn
```

### source-table-has-description {#source-table-has-description}

**warn** · Documentation · tags: `strict`

Document every source table with a non-empty description.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.source-table-has-description=warn
```

### undocumented-model {#undocumented-model}

**warn** · Documentation · tags: `strict`

Declare every model in a schema YAML file with name and description

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.undocumented-model=warn
```

### undocumented-sources {#undocumented-sources}

**warn** · Documentation

- Requires `target/manifest.json`

Document every source table for lineage clarity and governance.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.undocumented-sources=warn
```

## Governance {#governance}

- [`column-name-contract`](#column-name-contract)
- [`exposure-documented`](#exposure-documented)
- [`exposure-has-meta-keys`](#exposure-has-meta-keys)
- [`exposures-on-private-models`](#exposures-on-private-models)
- [`macro-has-meta-keys`](#macro-has-meta-keys)
- [`model-columns-have-meta-keys`](#model-columns-have-meta-keys)
- [`model-has-all-columns`](#model-has-all-columns)
- [`model-has-constraints`](#model-has-constraints)
- [`model-has-generic-constraints`](#model-has-generic-constraints)
- [`model-has-labels-keys`](#model-has-labels-keys)
- [`model-has-meta-keys`](#model-has-meta-keys)
- [`model-name-contract`](#model-name-contract)
- [`model-owner-or-meta`](#model-owner-or-meta)
- [`model-single-pk-column-level`](#model-single-pk-column-level)
- [`model-tags`](#model-tags)
- [`no-hardcoded-env`](#no-hardcoded-env)
- [`required-tags-met`](#required-tags-met)
- [`seed-has-meta-keys`](#seed-has-meta-keys)
- [`seed-has-owner`](#seed-has-owner)
- [`snapshot-has-meta-keys`](#snapshot-has-meta-keys)
- [`source-has-all-columns`](#source-has-all-columns)
- [`source-has-labels-keys`](#source-has-labels-keys)
- [`source-has-loader`](#source-has-loader)
- [`source-has-meta-keys`](#source-has-meta-keys)
- [`source-pii-meta`](#source-pii-meta)
- [`source-tags`](#source-tags)
- [`test-has-meta-keys`](#test-has-meta-keys)
- [`test-tags`](#test-tags)

### column-name-contract {#column-name-contract}

**warn** · Governance

Set `rules.column-name-contract.pattern.<matcher>=<regex>` in .dbt-doctor to enforce column naming contracts.

**Configuration**

| Option              | Type                       | Description                                                                                |
| ------------------- | -------------------------- | ------------------------------------------------------------------------------------------ |
| `severity`          | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested).                                                        |
| `pattern.<matcher>` | string (regex)             | Matcher is a column name or `re:<regex>`. Value is the pattern the column name must match. |

Example `.dbt-doctor`:

```ini
rules.column-name-contract=warn
rules.column-name-contract.pattern.amount=^.*_amount$
rules.column-name-contract.pattern.re:.*_id$=^.*_id$
```

### exposure-documented {#exposure-documented}

**warn** · Governance · tags: `enterprise`

Document exposures with description and owner

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.exposure-documented=warn
```

### exposure-has-meta-keys {#exposure-has-meta-keys}

**warn** · Governance

Set `rules.exposure-has-meta-keys.required` in .dbt-doctor to enforce required meta keys on exposures.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |
| `required` | string[]                   | Required exposure meta keys.        |

Example `.dbt-doctor`:

```ini
rules.exposure-has-meta-keys=warn
rules.exposure-has-meta-keys.required=owner
```

### exposures-on-private-models {#exposures-on-private-models}

**error** · Governance

- Requires `target/manifest.json`

Public exposures should not directly depend on private models.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.exposures-on-private-models=error
```

### macro-has-meta-keys {#macro-has-meta-keys}

**warn** · Governance · tags: `enterprise`

Set `rules.macro-has-meta-keys.required` to enforce required macro-level meta keys.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.macro-has-meta-keys=warn
```

### model-columns-have-meta-keys {#model-columns-have-meta-keys}

**warn** · Governance · tags: `strict`

Set `rules.model-columns-have-meta-keys.required` to enforce required column-level meta keys.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.model-columns-have-meta-keys=warn
```

### model-has-all-columns {#model-has-all-columns}

**warn** · Governance

- Requires `target/manifest.json`

Set `rules.model-has-all-columns.required=[...]` (JSON config) to enforce required manifest-described columns.

**Configuration**

| Option     | Type                       | Description                                        |
| ---------- | -------------------------- | -------------------------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested).                |
| `required` | string[]                   | Columns that must appear in the model schema YAML. |

Example `.dbt-doctor`:

```ini
rules.model-has-all-columns=warn
rules.model-has-all-columns.required=id,created_at
```

### model-has-constraints {#model-has-constraints}

**warn** · Governance

Set constraints on models/columns in schema YAML.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |
| `enabled`  | boolean                    | Opt-in rule.                        |

Example `.dbt-doctor`:

```ini
rules.model-has-constraints=warn
rules.model-has-constraints.enabled=true
```

### model-has-generic-constraints {#model-has-generic-constraints}

**warn** · Governance

Use generic constraints (not_null, unique, primary_key, foreign_key, check) in YAML.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |
| `enabled`  | boolean                    | Opt-in rule.                        |

Example `.dbt-doctor`:

```ini
rules.model-has-generic-constraints=warn
rules.model-has-generic-constraints.enabled=true
```

### model-has-labels-keys {#model-has-labels-keys}

**warn** · Governance

Set `rules.model-has-labels-keys.required` in .dbt-doctor to enforce required labels keys.

**Configuration**

| Option     | Type                       | Description                                  |
| ---------- | -------------------------- | -------------------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested).          |
| `required` | string[]                   | Required keys under `labels:` on each model. |

Example `.dbt-doctor`:

```ini
rules.model-has-labels-keys=warn
rules.model-has-labels-keys.required=environment,tier
```

### model-has-meta-keys {#model-has-meta-keys}

**warn** · Governance

Set `rules.model-has-meta-keys.required` in .dbt-doctor to enforce required model meta keys.

**Configuration**

| Option     | Type                       | Description                                |
| ---------- | -------------------------- | ------------------------------------------ |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested).        |
| `required` | string[]                   | Required keys under `meta:` on each model. |

Example `.dbt-doctor`:

```ini
rules.model-has-meta-keys=warn
rules.model-has-meta-keys.required=owner,team
```

### model-name-contract {#model-name-contract}

**warn** · Governance

See the [Rules reference](/docs/rules) for configuration options.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |
| `pattern`  | string (regex)             | Model name must match this pattern. |

Example `.dbt-doctor`:

```ini
rules.model-name-contract=warn
rules.model-name-contract.pattern=^(stg|int|fct|dim)_[a-z0-9_]+$
```

### model-owner-or-meta {#model-owner-or-meta}

**warn** · Governance · tags: `enterprise`

Set meta.owner (or owner) on mart models for accountability

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.model-owner-or-meta=warn
```

### model-single-pk-column-level {#model-single-pk-column-level}

**warn** · Governance · tags: `enterprise`

Define exactly one primary key at column level when PK is required.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.model-single-pk-column-level=warn
```

### model-tags {#model-tags}

**warn** · Governance

Set `rules.model-tags.allowed` in .dbt-doctor to enforce allowed model tags.

**Configuration**

| Option     | Type                       | Description                                  |
| ---------- | -------------------------- | -------------------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested).          |
| `allowed`  | string[]                   | Models must have at least one of these tags. |

Example `.dbt-doctor`:

```ini
rules.model-tags=warn
rules.model-tags.allowed=daily,hourly,nightly
```

### no-hardcoded-env {#no-hardcoded-env}

**error** · Governance · tags: `enterprise`

Avoid hardcoded environment or project names in model SQL

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.no-hardcoded-env=error
```

### required-tags-met {#required-tags-met}

**warn** · Governance

Satisfy +required_tags from dbt_project.yml by declaring all required tags on models/seeds/sources.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.required-tags-met=warn
```

### seed-has-meta-keys {#seed-has-meta-keys}

**warn** · Governance

Set `rules.seed-has-meta-keys.required` in .dbt-doctor to enforce required meta keys on seeds.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |
| `required` | string[]                   | Required seed meta keys.            |

Example `.dbt-doctor`:

```ini
rules.seed-has-meta-keys=warn
rules.seed-has-meta-keys.required=owner
```

### seed-has-owner {#seed-has-owner}

**warn** · Governance · tags: `strict`

Set meta.owner (or owner) on every documented seed for accountability

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.seed-has-owner=warn
```

### snapshot-has-meta-keys {#snapshot-has-meta-keys}

**warn** · Governance

Set `rules.snapshot-has-meta-keys.required` in .dbt-doctor to enforce required meta keys on snapshots.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |
| `required` | string[]                   | Required snapshot meta keys.        |

Example `.dbt-doctor`:

```ini
rules.snapshot-has-meta-keys=warn
rules.snapshot-has-meta-keys.required=owner
```

### source-has-all-columns {#source-has-all-columns}

**warn** · Governance · tags: `enterprise`

Keep source YAML columns aligned with the discovered catalog columns (target/catalog.json).

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.source-has-all-columns=warn
```

### source-has-labels-keys {#source-has-labels-keys}

**warn** · Governance

Set `rules.source-has-labels-keys.required` in .dbt-doctor to enforce required labels keys on sources.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |
| `required` | string[]                   | Required source labels keys.        |

Example `.dbt-doctor`:

```ini
rules.source-has-labels-keys=warn
rules.source-has-labels-keys.required=tier
```

### source-has-loader {#source-has-loader}

**warn** · Governance

Declare `loader:` for each source in source YAML.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.source-has-loader=warn
```

### source-has-meta-keys {#source-has-meta-keys}

**warn** · Governance

Set `rules.source-has-meta-keys.required` in .dbt-doctor to enforce required meta keys on source tables.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |
| `required` | string[]                   | Required source meta keys.          |

Example `.dbt-doctor`:

```ini
rules.source-has-meta-keys=warn
rules.source-has-meta-keys.required=owner
```

### source-pii-meta {#source-pii-meta}

**warn** · Governance · tags: `enterprise`

Tag PII columns with meta (pii, sensitive) for governance

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.source-pii-meta=warn
```

### source-tags {#source-tags}

**warn** · Governance

Set `rules.source-tags.allowed` in .dbt-doctor to enforce allowed source table tags.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |
| `allowed`  | string[]                   | Allowed source tags.                |

Example `.dbt-doctor`:

```ini
rules.source-tags=warn
rules.source-tags.allowed=raw,external
```

### test-has-meta-keys {#test-has-meta-keys}

**warn** · Governance

Set `rules.test-has-meta-keys.required` in .dbt-doctor to enforce required meta keys on singular tests.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |
| `required` | string[]                   | Required test meta keys.            |

Example `.dbt-doctor`:

```ini
rules.test-has-meta-keys=warn
rules.test-has-meta-keys.required=owner
```

### test-tags {#test-tags}

**warn** · Governance

Set `rules.test-tags.allowed` in .dbt-doctor to enforce allowed tags on singular tests.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |
| `allowed`  | string[]                   | Allowed test tags.                  |

Example `.dbt-doctor`:

```ini
rules.test-tags=warn
rules.test-tags.allowed=critical,data
```

## Naming {#naming}

- [`intermediate-prefix`](#intermediate-prefix)
- [`marts-prefix`](#marts-prefix)
- [`model-path-layer-mismatch`](#model-path-layer-mismatch)
- [`staging-naming-convention`](#staging-naming-convention)
- [`staging-prefix`](#staging-prefix)

### intermediate-prefix {#intermediate-prefix}

**warn** · Naming

Use int\_ prefix for intermediate models

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.intermediate-prefix=warn
```

### marts-prefix {#marts-prefix}

**warn** · Naming

Use fct* or dim* prefix for mart models

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.marts-prefix=warn
```

### model-path-layer-mismatch {#model-path-layer-mismatch}

**warn** · Naming · tags: `enterprise`

Model name prefix should match its layer folder (stg*, int*, fct*/dim*)

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.model-path-layer-mismatch=warn
```

### staging-naming-convention {#staging-naming-convention}

**warn** · Naming

Name staging models stg\_<source>\_\_<entity> (double underscore)

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.staging-naming-convention=warn
```

### staging-prefix {#staging-prefix}

**warn** · Naming

Use stg\_ prefix for staging models

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.staging-prefix=warn
```

## Performance {#performance}

- [`bigquery-partition-filter`](#bigquery-partition-filter)
- [`chained-views`](#chained-views)
- [`cluster-by-hint`](#cluster-by-hint)
- [`exposure-parents-materializations`](#exposure-parents-materializations)
- [`model-materialization-by-childs`](#model-materialization-by-childs)

### bigquery-partition-filter {#bigquery-partition-filter}

**warn** · Performance · tags: `bigquery`

- Adapter: `bigquery`

Filter on partition columns in BigQuery models

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.bigquery-partition-filter=warn
```

### chained-views {#chained-views}

**warn** · Performance

- Requires `target/manifest.json`

Long chains of views can increase query latency and failure blast radius.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.chained-views=warn
```

### cluster-by-hint {#cluster-by-hint}

**warn** · Performance · tags: `enterprise`, `bigquery`

- Adapter: `bigquery`

Large BigQuery models benefit from cluster_by in config

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.cluster-by-hint=warn
```

### exposure-parents-materializations {#exposure-parents-materializations}

**warn** · Performance

- Requires `target/manifest.json`

Exposures should avoid depending on fragile view/ephemeral parent models.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.exposure-parents-materializations=warn
```

### model-materialization-by-childs {#model-materialization-by-childs}

**warn** · Performance

- Requires `target/manifest.json`

Heavily reused parent models should use durable materializations.

**Configuration**

| Option         | Type                       | Description                                     |
| -------------- | -------------------------- | ----------------------------------------------- |
| `severity`     | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested).             |
| `minChildren`  | number                     | Child count threshold.                          |
| `materialized` | string                     | Expected materialization when threshold is met. |

Example `.dbt-doctor`:

```ini
rules.model-materialization-by-childs=warn
rules.model-materialization-by-childs.minChildren=3
rules.model-materialization-by-childs.materialized=table
```

## Sources {#sources}

- [`duplicate-sources`](#duplicate-sources)
- [`source-freshness`](#source-freshness)
- [`unused-sources`](#unused-sources)

### duplicate-sources {#duplicate-sources}

**warn** · Sources

- Requires `target/manifest.json`

Duplicate source definitions can fragment lineage and governance.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.duplicate-sources=warn
```

### source-freshness {#source-freshness}

**warn** · Sources

Configure freshness on production sources

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.source-freshness=warn
```

### unused-sources {#unused-sources}

**warn** · Sources

- Requires `target/manifest.json`

Remove unused sources or connect them to downstream models.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.unused-sources=warn
```

## SQL Convention {#sql-convention}

- [`sql-between-symmetric-style`](#sql-between-symmetric-style)
- [`sql-boolean-literal-style`](#sql-boolean-literal-style)
- [`sql-cast-style-consistency`](#sql-cast-style-consistency)
- [`sql-coalesce-preferred`](#sql-coalesce-preferred)
- [`sql-count-star-preferred`](#sql-count-star-preferred)
- [`sql-join-using-consistency`](#sql-join-using-consistency)
- [`sql-null-literal-style`](#sql-null-literal-style)
- [`sql-reference-unnecessary-quoted`](#sql-reference-unnecessary-quoted)
- [`sql-tsql-bare-temp-table`](#sql-tsql-bare-temp-table)
- [`sql-tsql-sp-prefix`](#sql-tsql-sp-prefix)
- [`sql-tsql-sys-schema-qualified`](#sql-tsql-sys-schema-qualified)
- [`sql-zero-length-string-style`](#sql-zero-length-string-style)

### sql-between-symmetric-style {#sql-between-symmetric-style}

**warn** · SQL Convention · tags: `style`, `sql-style`

Avoid BETWEEN SYMMETRIC for broader dialect portability.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-between-symmetric-style=warn
```

### sql-boolean-literal-style {#sql-boolean-literal-style}

**warn** · SQL Convention · tags: `style`, `sql-style`

Use uppercase boolean literals.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-boolean-literal-style=warn
```

### sql-cast-style-consistency {#sql-cast-style-consistency}

**warn** · SQL Convention · tags: `style`, `sql-style`

Use one cast style consistently within a file.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-cast-style-consistency=warn
```

### sql-coalesce-preferred {#sql-coalesce-preferred}

**warn** · SQL Convention · tags: `style`, `sql-style`

Prefer COALESCE over dialect-specific null-handling helpers.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-coalesce-preferred=warn
```

### sql-count-star-preferred {#sql-count-star-preferred}

**warn** · SQL Convention · tags: `style`, `sql-style`

Prefer COUNT(\*) over COUNT(1) or COUNT(constant).

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-count-star-preferred=warn
```

### sql-join-using-consistency {#sql-join-using-consistency}

**warn** · SQL Convention · tags: `style`, `sql-style`

Prefer ON clauses over USING for explicit join semantics.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-join-using-consistency=warn
```

### sql-null-literal-style {#sql-null-literal-style}

**warn** · SQL Convention · tags: `style`, `sql-style`

Use NULL keyword, not quoted

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-null-literal-style=warn
```

### sql-reference-unnecessary-quoted {#sql-reference-unnecessary-quoted}

**warn** · SQL Convention · tags: `style`, `sql-style`

Avoid unnecessary quoted identifiers when plain identifiers are safe.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-reference-unnecessary-quoted=warn
```

### sql-tsql-bare-temp-table {#sql-tsql-bare-temp-table}

**warn** · SQL Convention · tags: `style`, `sql-style`

Avoid bare temporary-table references in reusable dbt SQL.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-tsql-bare-temp-table=warn
```

### sql-tsql-sp-prefix {#sql-tsql-sp-prefix}

**warn** · SQL Convention · tags: `style`, `sql-style`

In T-SQL, avoid `sp_` prefix for user-defined procedures.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-tsql-sp-prefix=warn
```

### sql-tsql-sys-schema-qualified {#sql-tsql-sys-schema-qualified}

**warn** · SQL Convention · tags: `style`, `sql-style`

System catalogs should be schema-qualified in T-SQL.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-tsql-sys-schema-qualified=warn
```

### sql-zero-length-string-style {#sql-zero-length-string-style}

**warn** · SQL Convention · tags: `style`, `sql-style`

Handle zero-length strings explicitly and consistently.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-zero-length-string-style=warn
```

## SQL Quality {#sql-quality}

- [`database-casing-consistency`](#database-casing-consistency)
- [`empty-model-file`](#empty-model-file)
- [`jinja-syntax-valid`](#jinja-syntax-valid)
- [`no-select-star`](#no-select-star)
- [`script-semicolon`](#script-semicolon)
- [`sql-ambiguous-order-by-target`](#sql-ambiguous-order-by-target)
- [`sql-boolean-comparison-simplify`](#sql-boolean-comparison-simplify)
- [`sql-constant-expression`](#sql-constant-expression)
- [`sql-distinct-with-order-by-non-selected`](#sql-distinct-with-order-by-non-selected)
- [`sql-join-condition-required`](#sql-join-condition-required)
- [`sql-no-comma-join`](#sql-no-comma-join)
- [`sql-no-subquery-in-join`](#sql-no-subquery-in-join)
- [`sql-null-comparison-operator`](#sql-null-comparison-operator)
- [`sql-order-by-distinct-compatibility`](#sql-order-by-distinct-compatibility)
- [`sql-order-by-ordinal-unambiguous`](#sql-order-by-ordinal-unambiguous)
- [`sql-prefer-bang-equals`](#sql-prefer-bang-equals)
- [`sql-reference-object-in-from`](#sql-reference-object-in-from)
- [`sql-reference-target-exists`](#sql-reference-target-exists)
- [`sql-set-operator-column-count-match`](#sql-set-operator-column-count-match)
- [`sql-single-statement-model`](#sql-single-statement-model)
- [`sql-union-distinct-redundant`](#sql-union-distinct-redundant)
- [`sql-unique-column-aliases`](#sql-unique-column-aliases)
- [`sql-unused-join-alias`](#sql-unused-join-alias)
- [`too-many-joins`](#too-many-joins)

### database-casing-consistency {#database-casing-consistency}

**warn** · SQL Quality

Use consistent casing for database identifiers in three-part table names.

**Configuration**

| Option     | Type                       | Description                                           |
| ---------- | -------------------------- | ----------------------------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested).                   |
| `enabled`  | boolean                    | Opt-in rule. Requires manifest.json and catalog.json. |

Example `.dbt-doctor`:

```ini
rules.database-casing-consistency=warn
rules.database-casing-consistency.enabled=true
```

### empty-model-file {#empty-model-file}

**error** · SQL Quality

See the [Rules reference](/docs/rules) for configuration options.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.empty-model-file=error
```

### jinja-syntax-valid {#jinja-syntax-valid}

**warn** · SQL Quality · tags: `strict`

Ensure all Jinja tags in SQL have matching closing delimiters.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.jinja-syntax-valid=warn
```

### no-select-star {#no-select-star}

**error** · SQL Quality

List columns explicitly instead of SELECT \*

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.no-select-star=error
```

### script-semicolon {#script-semicolon}

**warn** · SQL Quality · tags: `strict`

Avoid a trailing semicolon at end of dbt model SQL.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.script-semicolon=warn
```

### sql-ambiguous-order-by-target {#sql-ambiguous-order-by-target}

**warn** · SQL Quality · tags: `style`, `sql-style`

Avoid ambiguous ORDER BY targets that can resolve to multiple expressions.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-ambiguous-order-by-target=warn
```

### sql-boolean-comparison-simplify {#sql-boolean-comparison-simplify}

**warn** · SQL Quality · tags: `style`, `sql-style`

Avoid explicit boolean equality comparisons where predicate forms are clearer.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-boolean-comparison-simplify=warn
```

### sql-constant-expression {#sql-constant-expression}

**warn** · SQL Quality · tags: `style`, `sql-style`

Avoid constant or always-true expressions in predicates.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-constant-expression=warn
```

### sql-distinct-with-order-by-non-selected {#sql-distinct-with-order-by-non-selected}

**warn** · SQL Quality · tags: `style`, `sql-style`

Avoid DISTINCT + ORDER BY columns that are not clearly part of selected outputs.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-distinct-with-order-by-non-selected=warn
```

### sql-join-condition-required {#sql-join-condition-required}

**warn** · SQL Quality · tags: `style`, `sql-style`

JOIN clauses should include ON/USING conditions unless cross join is explicit.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-join-condition-required=warn
```

### sql-no-comma-join {#sql-no-comma-join}

**warn** · SQL Quality · tags: `style`, `sql-style`

Use explicit JOIN syntax instead of comma joins in FROM clauses.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-no-comma-join=warn
```

### sql-no-subquery-in-join {#sql-no-subquery-in-join}

**warn** · SQL Quality · tags: `style`, `sql-style`

Avoid subqueries inside JOIN clauses; prefer CTEs for readability and reuse.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-no-subquery-in-join=warn
```

### sql-null-comparison-operator {#sql-null-comparison-operator}

**warn** · SQL Quality · tags: `style`, `sql-style`

Use IS NULL / IS NOT NULL instead of equality operators with NULL.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-null-comparison-operator=warn
```

### sql-order-by-distinct-compatibility {#sql-order-by-distinct-compatibility}

**warn** · SQL Quality · tags: `style`, `sql-style`

In DISTINCT queries, ORDER BY expressions should be selected or positional.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-order-by-distinct-compatibility=warn
```

### sql-order-by-ordinal-unambiguous {#sql-order-by-ordinal-unambiguous}

**warn** · SQL Quality · tags: `style`, `sql-style`

Avoid ordinal ORDER BY references in complex queries.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-order-by-ordinal-unambiguous=warn
```

### sql-prefer-bang-equals {#sql-prefer-bang-equals}

**warn** · SQL Quality · tags: `style`, `sql-style`

Use != instead of <> for inequality to keep operator style consistent.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-prefer-bang-equals=warn
```

### sql-reference-object-in-from {#sql-reference-object-in-from}

**warn** · SQL Quality · tags: `style`, `sql-style`

Qualified references should use aliases/relations declared in FROM or JOIN clauses.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-reference-object-in-from=warn
```

### sql-reference-target-exists {#sql-reference-target-exists}

**warn** · SQL Quality · tags: `style`, `sql-style`

- Requires `target/manifest.json`

Ensure every ref() and source() target exists in manifest metadata.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-reference-target-exists=warn
```

### sql-set-operator-column-count-match {#sql-set-operator-column-count-match}

**warn** · SQL Quality · tags: `style`, `sql-style`

SELECT statements in set operators should project the same number of columns.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-set-operator-column-count-match=warn
```

### sql-single-statement-model {#sql-single-statement-model}

**warn** · SQL Quality · tags: `style`, `sql-style`

Keep dbt model SQL to a single SELECT statement.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-single-statement-model=warn
```

### sql-union-distinct-redundant {#sql-union-distinct-redundant}

**warn** · SQL Quality · tags: `style`, `sql-style`

Use UNION (default distinct) or UNION ALL; avoid redundant UNION DISTINCT.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-union-distinct-redundant=warn
```

### sql-unique-column-aliases {#sql-unique-column-aliases}

**warn** · SQL Quality · tags: `style`, `sql-style`

Column aliases should be unique within a SELECT clause.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-unique-column-aliases=warn
```

### sql-unused-join-alias {#sql-unused-join-alias}

**warn** · SQL Quality · tags: `style`, `sql-style`

Joined table aliases should be referenced or removed.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-unused-join-alias=warn
```

### too-many-joins {#too-many-joins}

**warn** · SQL Quality

- Requires `target/manifest.json`

Models with too many joins are harder to maintain and can degrade performance.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.too-many-joins=warn
```

## SQL Style {#sql-style}

- [`jinja-tag-padding`](#jinja-tag-padding)
- [`sql-alias-length-min`](#sql-alias-length-min)
- [`sql-alias-not-keyword`](#sql-alias-not-keyword)
- [`sql-ambiguous-distinct-group-by`](#sql-ambiguous-distinct-group-by)
- [`sql-ambiguous-join-type`](#sql-ambiguous-join-type)
- [`sql-boolean-null-case`](#sql-boolean-null-case)
- [`sql-case-nesting`](#sql-case-nesting)
- [`sql-clause-newline-consistency`](#sql-clause-newline-consistency)
- [`sql-cte-blank-line-after`](#sql-cte-blank-line-after)
- [`sql-cte-bracket-position`](#sql-cte-bracket-position)
- [`sql-data-type-case`](#sql-data-type-case)
- [`sql-derived-table-alias-required`](#sql-derived-table-alias-required)
- [`sql-distinct-parentheses`](#sql-distinct-parentheses)
- [`sql-explicit-column-alias`](#sql-explicit-column-alias)
- [`sql-explicit-join-type`](#sql-explicit-join-type)
- [`sql-explicit-table-alias`](#sql-explicit-table-alias)
- [`sql-expression-alias-required`](#sql-expression-alias-required)
- [`sql-file-trailing-newline`](#sql-file-trailing-newline)
- [`sql-function-name-case`](#sql-function-name-case)
- [`sql-function-spacing`](#sql-function-spacing)
- [`sql-indentation-consistency`](#sql-indentation-consistency)
- [`sql-join-condition-in-on-clause`](#sql-join-condition-in-on-clause)
- [`sql-keywords-case`](#sql-keywords-case)
- [`sql-leading-commas`](#sql-leading-commas)
- [`sql-max-consecutive-blank-lines`](#sql-max-consecutive-blank-lines)
- [`sql-no-consecutive-semicolons`](#sql-no-consecutive-semicolons)
- [`sql-no-else-null-case`](#sql-no-else-null-case)
- [`sql-no-leading-whitespace`](#sql-no-leading-whitespace)
- [`sql-no-positional-group-order`](#sql-no-positional-group-order)
- [`sql-no-self-alias`](#sql-no-self-alias)
- [`sql-operator-spacing`](#sql-operator-spacing)
- [`sql-order-by-direction-consistency`](#sql-order-by-direction-consistency)
- [`sql-quoted-literal-style`](#sql-quoted-literal-style)
- [`sql-reference-consistency`](#sql-reference-consistency)
- [`sql-reference-keyword-quoted`](#sql-reference-keyword-quoted)
- [`sql-reference-special-chars-quoted`](#sql-reference-special-chars-quoted)
- [`sql-references-qualified`](#sql-references-qualified)
- [`sql-select-targets-layout`](#sql-select-targets-layout)
- [`sql-select-trailing-comma`](#sql-select-trailing-comma)
- [`sql-self-join-alias-distinct`](#sql-self-join-alias-distinct)
- [`sql-set-operator-newline`](#sql-set-operator-newline)
- [`sql-simple-case-preferred`](#sql-simple-case-preferred)
- [`sql-trailing-commas`](#sql-trailing-commas)
- [`sql-trailing-whitespace`](#sql-trailing-whitespace)
- [`sql-union-explicit-qualifier`](#sql-union-explicit-qualifier)
- [`sql-unique-table-aliases`](#sql-unique-table-aliases)
- [`sql-unquoted-identifiers-case`](#sql-unquoted-identifiers-case)
- [`sql-unused-cte`](#sql-unused-cte)

### jinja-tag-padding {#jinja-tag-padding}

**warn** · SQL Style · tags: `strict`

Use a single space around content inside Jinja tags on single-line expressions.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.jinja-tag-padding=warn
```

### sql-alias-length-min {#sql-alias-length-min}

**warn** · SQL Style · tags: `style`, `sql-style`

Avoid overly short table aliases.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-alias-length-min=warn
```

### sql-alias-not-keyword {#sql-alias-not-keyword}

**warn** · SQL Style · tags: `style`, `sql-style`

Avoid SQL reserved words as aliases.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-alias-not-keyword=warn
```

### sql-ambiguous-distinct-group-by {#sql-ambiguous-distinct-group-by}

**warn** · SQL Style · tags: `style`, `sql-style`

Avoid combining DISTINCT with GROUP BY in the same SELECT statement.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-ambiguous-distinct-group-by=warn
```

### sql-ambiguous-join-type {#sql-ambiguous-join-type}

**warn** · SQL Style · tags: `style`, `sql-style`

Make JOIN type explicit (INNER/LEFT/RIGHT/FULL/CROSS).

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-ambiguous-join-type=warn
```

### sql-boolean-null-case {#sql-boolean-null-case}

**warn** · SQL Style · tags: `style`, `sql-style`

Use consistent capitalization for TRUE/FALSE/NULL literals.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-boolean-null-case=warn
```

### sql-case-nesting {#sql-case-nesting}

**warn** · SQL Style · tags: `style`, `sql-style`

Avoid nested CASE expressions where possible.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-case-nesting=warn
```

### sql-clause-newline-consistency {#sql-clause-newline-consistency}

**warn** · SQL Style · tags: `style`, `sql-style`

Place major clauses on their own lines for consistent query layout.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-clause-newline-consistency=warn
```

### sql-cte-blank-line-after {#sql-cte-blank-line-after}

**warn** · SQL Style · tags: `style`, `sql-style`

Insert a blank line between the final CTE and the main SELECT.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-cte-blank-line-after=warn
```

### sql-cte-bracket-position {#sql-cte-bracket-position}

**warn** · SQL Style · tags: `style`, `sql-style`

Use one space between AS and opening parenthesis in CTE definitions.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-cte-bracket-position=warn
```

### sql-data-type-case {#sql-data-type-case}

**warn** · SQL Style · tags: `style`, `sql-style`

Use uppercase data types in CAST expressions.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-data-type-case=warn
```

### sql-derived-table-alias-required {#sql-derived-table-alias-required}

**warn** · SQL Style · tags: `style`, `sql-style`

Derived tables should always be aliased.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-derived-table-alias-required=warn
```

### sql-distinct-parentheses {#sql-distinct-parentheses}

**warn** · SQL Style · tags: `style`, `sql-style`

Avoid DISTINCT wrapped in parentheses.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-distinct-parentheses=warn
```

### sql-explicit-column-alias {#sql-explicit-column-alias}

**warn** · SQL Style · tags: `style`, `sql-style`

Use explicit AS for select-expression aliases.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-explicit-column-alias=warn
```

### sql-explicit-join-type {#sql-explicit-join-type}

**warn** · SQL Style · tags: `style`, `sql-style`

Use explicit JOIN type (e.g. INNER JOIN, LEFT JOIN).

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-explicit-join-type=warn
```

### sql-explicit-table-alias {#sql-explicit-table-alias}

**warn** · SQL Style · tags: `style`, `sql-style`

Use explicit AS for table/subquery aliases.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-explicit-table-alias=warn
```

### sql-expression-alias-required {#sql-expression-alias-required}

**warn** · SQL Style · tags: `style`, `sql-style`

Alias expression targets in SELECT lists for readability and stable downstream references.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-expression-alias-required=warn
```

### sql-file-trailing-newline {#sql-file-trailing-newline}

**warn** · SQL Style · tags: `style`, `sql-style`

Ensure SQL files end with a trailing newline.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-file-trailing-newline=warn
```

### sql-function-name-case {#sql-function-name-case}

**warn** · SQL Style · tags: `style`, `sql-style`

Use consistent capitalization for SQL function names.

**Configuration**

| Option                 | Type                       | Description                         |
| ---------------------- | -------------------------- | ----------------------------------- | ---------- | ---------------------------- |
| `severity`             | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |
| `capitalisationPolicy` | upper                      | lower                               | consistent | Function name casing policy. |

Example `.dbt-doctor`:

```ini
rules.sql-function-name-case=warn
rules.sql-function-name-case.capitalisationPolicy=upper
```

### sql-function-spacing {#sql-function-spacing}

**warn** · SQL Style · tags: `style`, `sql-style`

Do not add whitespace between function names and parentheses.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-function-spacing=warn
```

### sql-indentation-consistency {#sql-indentation-consistency}

**warn** · SQL Style · tags: `style`, `sql-style`

Use consistent spaces-only indentation.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-indentation-consistency=warn
```

### sql-join-condition-in-on-clause {#sql-join-condition-in-on-clause}

**warn** · SQL Style · tags: `style`, `sql-style`

Put join predicates in ON clauses rather than WHERE clauses.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-join-condition-in-on-clause=warn
```

### sql-keywords-case {#sql-keywords-case}

**warn** · SQL Style · tags: `style`, `sql-style`

Use consistent keyword capitalization (SQLFluff-style).

**Configuration**

| Option                 | Type                       | Description                         |
| ---------------------- | -------------------------- | ----------------------------------- | ---------- | ------------------------------------------------ |
| `severity`             | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |
| `capitalisationPolicy` | upper                      | lower                               | consistent | SQL keyword casing policy (default: consistent). |

Example `.dbt-doctor`:

```ini
rules.sql-keywords-case=warn
rules.sql-keywords-case.capitalisationPolicy=upper
```

### sql-leading-commas {#sql-leading-commas}

**warn** · SQL Style · tags: `style`, `sql-style`

Use leading comma placement in comma-separated SQL lists.

**Configuration**

| Option     | Type                       | Description                                   |
| ---------- | -------------------------- | --------------------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested).           |
| `enabled`  | boolean                    | Enable leading-comma layout (default: false). |

Example `.dbt-doctor`:

```ini
rules.sql-leading-commas=warn
rules.sql-leading-commas.enabled=true
```

### sql-max-consecutive-blank-lines {#sql-max-consecutive-blank-lines}

**warn** · SQL Style · tags: `style`, `sql-style`

Limit consecutive blank lines in SQL files.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-max-consecutive-blank-lines=warn
```

### sql-no-consecutive-semicolons {#sql-no-consecutive-semicolons}

**warn** · SQL Style · tags: `style`, `sql-style`

Avoid consecutive empty statement separators.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-no-consecutive-semicolons=warn
```

### sql-no-else-null-case {#sql-no-else-null-case}

**warn** · SQL Style · tags: `style`, `sql-style`

Avoid redundant ELSE NULL in CASE expressions.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-no-else-null-case=warn
```

### sql-no-leading-whitespace {#sql-no-leading-whitespace}

**warn** · SQL Style · tags: `style`, `sql-style`

Do not start SQL files with leading whitespace.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-no-leading-whitespace=warn
```

### sql-no-positional-group-order {#sql-no-positional-group-order}

**warn** · SQL Style · tags: `style`, `sql-style`

Use explicit column names instead of positional GROUP BY / ORDER BY references.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-no-positional-group-order=warn
```

### sql-no-self-alias {#sql-no-self-alias}

**warn** · SQL Style · tags: `style`, `sql-style`

Avoid redundant self-aliasing like `col AS col`.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-no-self-alias=warn
```

### sql-operator-spacing {#sql-operator-spacing}

**warn** · SQL Style · tags: `style`, `sql-style`

Use single spaces around binary operators.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-operator-spacing=warn
```

### sql-order-by-direction-consistency {#sql-order-by-direction-consistency}

**warn** · SQL Style · tags: `style`, `sql-style`

Use consistent explicit ASC/DESC in ORDER BY lists.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-order-by-direction-consistency=warn
```

### sql-quoted-literal-style {#sql-quoted-literal-style}

**warn** · SQL Style · tags: `style`, `sql-style`

Use single quotes for string literals.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-quoted-literal-style=warn
```

### sql-reference-consistency {#sql-reference-consistency}

**warn** · SQL Style · tags: `style`, `sql-style`

Use a consistent reference style within a SELECT statement.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-reference-consistency=warn
```

### sql-reference-keyword-quoted {#sql-reference-keyword-quoted}

**warn** · SQL Style · tags: `style`, `sql-style`

If reserved words are used as identifiers, quote them explicitly.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-reference-keyword-quoted=warn
```

### sql-reference-special-chars-quoted {#sql-reference-special-chars-quoted}

**warn** · SQL Style · tags: `style`, `sql-style`

Identifiers containing special characters should be quoted.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-reference-special-chars-quoted=warn
```

### sql-references-qualified {#sql-references-qualified}

**warn** · SQL Style · tags: `style`, `sql-style`

Qualify references when selecting from multiple relations.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-references-qualified=warn
```

### sql-select-targets-layout {#sql-select-targets-layout}

**warn** · SQL Style · tags: `style`, `sql-style`

Format SELECT targets on new lines (SQLFluff layout.select_targets style).

**Configuration**

| Option               | Type                       | Description                              |
| -------------------- | -------------------------- | ---------------------------------------- |
| `severity`           | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested).      |
| `singleTargetPolicy` | string                     | Layout policy for single select targets. |
| `wildcardPolicy`     | string                     | Layout policy for wildcard selects.      |

Example `.dbt-doctor`:

```ini
rules.sql-select-targets-layout=warn
rules.sql-select-targets-layout.singleTargetPolicy=single
```

### sql-select-trailing-comma {#sql-select-trailing-comma}

**warn** · SQL Style · tags: `style`, `sql-style`

Disallow trailing commas at end of SELECT lists (SQLFluff CV03 default).

**Configuration**

| Option     | Type                       | Description                                               |
| ---------- | -------------------------- | --------------------------------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested).                       |
| `enabled`  | boolean                    | Disallow trailing commas in SELECT lists (default: true). |

Example `.dbt-doctor`:

```ini
rules.sql-select-trailing-comma=warn
rules.sql-select-trailing-comma.enabled=false
```

### sql-self-join-alias-distinct {#sql-self-join-alias-distinct}

**warn** · SQL Style · tags: `style`, `sql-style`

Self-joins should use distinct aliases per relation instance.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-self-join-alias-distinct=warn
```

### sql-set-operator-newline {#sql-set-operator-newline}

**warn** · SQL Style · tags: `style`, `sql-style`

Place set operators (UNION/INTERSECT/EXCEPT) on their own line boundaries.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-set-operator-newline=warn
```

### sql-simple-case-preferred {#sql-simple-case-preferred}

**warn** · SQL Style · tags: `style`, `sql-style`

Prefer simple CASE form when all WHEN clauses compare the same expression.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-simple-case-preferred=warn
```

### sql-trailing-commas {#sql-trailing-commas}

**warn** · SQL Style · tags: `style`, `sql-style`

Use trailing comma placement in comma-separated SQL lists.

**Configuration**

| Option     | Type                       | Description                              |
| ---------- | -------------------------- | ---------------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested).      |
| `enabled`  | boolean                    | Enforce trailing commas (default: true). |

Example `.dbt-doctor`:

```ini
rules.sql-trailing-commas=warn
rules.sql-trailing-commas.enabled=true
```

### sql-trailing-whitespace {#sql-trailing-whitespace}

**warn** · SQL Style · tags: `style`, `sql-style`

Remove trailing whitespace at end of lines.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-trailing-whitespace=warn
```

### sql-union-explicit-qualifier {#sql-union-explicit-qualifier}

**warn** · SQL Style · tags: `style`, `sql-style`

Use explicit UNION qualifier (UNION DISTINCT or UNION ALL).

**Configuration**

| Option                     | Type                       | Description                                          |
| -------------------------- | -------------------------- | ---------------------------------------------------- |
| `severity`                 | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested).                  |
| `requireExplicitQualifier` | boolean                    | Require UNION ALL or UNION DISTINCT (default: true). |

Example `.dbt-doctor`:

```ini
rules.sql-union-explicit-qualifier=warn
rules.sql-union-explicit-qualifier.requireExplicitQualifier=true
```

### sql-unique-table-aliases {#sql-unique-table-aliases}

**warn** · SQL Style · tags: `style`, `sql-style`

Use unique table aliases within a query block.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-unique-table-aliases=warn
```

### sql-unquoted-identifiers-case {#sql-unquoted-identifiers-case}

**warn** · SQL Style · tags: `style`, `sql-style`

Use consistent capitalization for unquoted identifiers.

**Configuration**

| Option                 | Type                       | Description                         |
| ---------------------- | -------------------------- | ----------------------------------- | ---------- | ---------------------------------- |
| `severity`             | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |
| `capitalisationPolicy` | upper                      | lower                               | consistent | Unquoted identifier casing policy. |

Example `.dbt-doctor`:

```ini
rules.sql-unquoted-identifiers-case=warn
rules.sql-unquoted-identifiers-case.capitalisationPolicy=lower
```

### sql-unused-cte {#sql-unused-cte}

**warn** · SQL Style · tags: `style`, `sql-style`

Remove CTEs that are defined but never referenced.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.sql-unused-cte=warn
```

## Structure {#structure}

- [`model-outside-layer-folder`](#model-outside-layer-folder)
- [`non-canonical-layer-folder`](#non-canonical-layer-folder)
- [`root-models`](#root-models)

### model-outside-layer-folder {#model-outside-layer-folder}

**warn** · Structure

Place models under staging/, intermediate/, or marts/ subfolders

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.model-outside-layer-folder=warn
```

### non-canonical-layer-folder {#non-canonical-layer-folder}

**warn** · Structure · tags: `enterprise`

Use standard layer folders (staging, intermediate, marts, utilities)

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.non-canonical-layer-folder=warn
```

### root-models {#root-models}

**warn** · Structure

- Requires `target/manifest.json`

Root models with no sources or model parents are usually accidental DAG roots.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.root-models=warn
```

## Testing {#testing}

- [`dbt-expectations-hint`](#dbt-expectations-hint)
- [`generic-test-present`](#generic-test-present)
- [`model-has-tests`](#model-has-tests)
- [`model-has-tests-by-group`](#model-has-tests-by-group)
- [`model-has-tests-by-name`](#model-has-tests-by-name)
- [`model-has-tests-by-type`](#model-has-tests-by-type)
- [`model-has-uniqueness-test`](#model-has-uniqueness-test)
- [`model-single-column-uniqueness`](#model-single-column-uniqueness)
- [`not-null-on-required-keys`](#not-null-on-required-keys)
- [`relationship-test-on-fk`](#relationship-test-on-fk)
- [`required-tests-met`](#required-tests-met)
- [`source-has-tests`](#source-has-tests)
- [`source-has-tests-by-group`](#source-has-tests-by-group)
- [`source-has-tests-by-name`](#source-has-tests-by-name)
- [`source-has-tests-by-type`](#source-has-tests-by-type)

### dbt-expectations-hint {#dbt-expectations-hint}

**warn** · Testing · tags: `enterprise`

Use dbt_expectations for volume, freshness, and distribution tests on marts

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.dbt-expectations-hint=warn
```

### generic-test-present {#generic-test-present}

**warn** · Testing

Add not_null or unique tests on primary keys

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.generic-test-present=warn
```

### model-has-tests {#model-has-tests}

**warn** · Testing · tags: `enterprise`

Mart models should declare at least one test in YAML

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.model-has-tests=warn
```

### model-has-tests-by-group {#model-has-tests-by-group}

**warn** · Testing

Set `rules.model-has-tests-by-group.<group>=<n>` (groups: uniqueness, nullness, relationships, accepted_values).

**Configuration**

| Option      | Type                       | Description                         |
| ----------- | -------------------------- | ----------------------------------- | ---------------- | ------ | ------------------------------------------------------------------- |
| `severity`  | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |
| `uniqueness | nullness                   | relationships                       | accepted_values` | number | Minimum tests in each group (see rule source for group membership). |

Example `.dbt-doctor`:

```ini
rules.model-has-tests-by-group=warn
rules.model-has-tests-by-group.uniqueness=1
rules.model-has-tests-by-group.nullness=1
```

### model-has-tests-by-name {#model-has-tests-by-name}

**warn** · Testing

Set `rules.model-has-tests-by-name.<test_name>=<count>` in .dbt-doctor to enforce minimum test counts.

**Configuration**

| Option        | Type                       | Description                                                        |
| ------------- | -------------------------- | ------------------------------------------------------------------ |
| `severity`    | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested).                                |
| `<test_name>` | number                     | Minimum count per test name (e.g. unique, not_null, custom tests). |

Example `.dbt-doctor`:

```ini
rules.model-has-tests-by-name=warn
rules.model-has-tests-by-name.unique=1
rules.model-has-tests-by-name.not_null=1
```

### model-has-tests-by-type {#model-has-tests-by-type}

**warn** · Testing

Set `rules.model-has-tests-by-type.schema=<n>` and/or `rules.model-has-tests-by-type.data=<n>` in .dbt-doctor.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |
| `schema`   | number                     | Minimum schema tests.               |
| `data`     | number                     | Minimum data tests.                 |

Example `.dbt-doctor`:

```ini
rules.model-has-tests-by-type=warn
rules.model-has-tests-by-type.schema=2
rules.model-has-tests-by-type.data=1
```

### model-has-uniqueness-test {#model-has-uniqueness-test}

**warn** · Testing · tags: `strict`

Models should include a uniqueness test for key columns.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.model-has-uniqueness-test=warn
```

### model-single-column-uniqueness {#model-single-column-uniqueness}

**warn** · Testing · tags: `strict`

At least one uniqueness test should exist at column level.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.model-single-column-uniqueness=warn
```

### not-null-on-required-keys {#not-null-on-required-keys}

**warn** · Testing · tags: `enterprise`

Primary and foreign key columns should have not_null tests

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.not-null-on-required-keys=warn
```

### relationship-test-on-fk {#relationship-test-on-fk}

**warn** · Testing · tags: `enterprise`

Add relationships tests on foreign-key-style columns

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.relationship-test-on-fk=warn
```

### required-tests-met {#required-tests-met}

**warn** · Testing

Satisfy +required_tests from dbt_project.yml by meeting minimum test counts per model path.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.required-tests-met=warn
```

### source-has-tests {#source-has-tests}

**warn** · Testing · tags: `strict`

Sources should declare at least one test (schema or data).

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.source-has-tests=warn
```

### source-has-tests-by-group {#source-has-tests-by-group}

**warn** · Testing · tags: `strict`

Set `rules.source-has-tests-by-group.<group>=<n>` (groups: uniqueness, nullness, relationships, accepted_values).

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.source-has-tests-by-group=warn
```

### source-has-tests-by-name {#source-has-tests-by-name}

**warn** · Testing · tags: `strict`

Set `rules.source-has-tests-by-name.<test_name>=<count>` in .dbt-doctor to enforce source test minimums.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.source-has-tests-by-name=warn
```

### source-has-tests-by-type {#source-has-tests-by-type}

**warn** · Testing · tags: `strict`

Set `rules.source-has-tests-by-type.schema=<n>` and/or `rules.source-has-tests-by-type.data=<n>` in .dbt-doctor.

**Configuration**

| Option     | Type                       | Description                         |
| ---------- | -------------------------- | ----------------------------------- |
| `severity` | `error` \| `warn` \| `off` | Set via `rules.<id>=` (not nested). |

Example `.dbt-doctor`:

```ini
rules.source-has-tests-by-type=warn
```
