# Presets

Presets bundle **which rules run**, **how strict the CI gate is**, and **category severities** — without listing every rule ID. Set one in `.dbt-doctor` or pass `--preset` on the CLI (CLI wins).

```ini
preset=strict
```

## Comparison

| | **default** | **strict** | **enterprise** |
| --- | --- | --- | --- |
| **Best for** | Day-to-day dev, first adoption | PR / CI documentation gates | Platform teams, governance programs |
| **Rules active** | Core (~65) | Core + `strict` (~75) | Full catalog except SQL style (~91) |
| **Skipped tags** | `enterprise`, `strict`, `style` | `enterprise`, `style` | `style` (`phase5`) |
| **`fail_on`** | (from CLI / config) | `error` | `warning` |
| **`score_mode`** | (default) | (default) | `files` |
| **Category bumps** | — | Documentation, Configuration, Architecture → `error`; Testing → `warn` | Governance, Architecture, Sources → `error`; Documentation, Performance, Testing → `warn` |

Omit `preset` entirely to run **all 122 rules** (every tag). Use that for audits or when you want SQL style and enterprise checks without a named bundle.

## Built-in severities

**16 rules** default to **error** (DAG/layering, hard-coded refs, empty models, config validity, `SELECT *`, incremental/snapshot keys, exposures on private models). The other **106** default to **warn** (documentation, style, performance hints, configurable governance). Override any rule with `rules.<id>=error|warn|off` in `.dbt-doctor`.

## Rule tags

Presets filter rules through `ignore.tags`. A rule is skipped when **any** of its tags appears in the ignore list.

| Tag | Rules (approx.) | What it covers |
| --- | --- | --- |
| *(none)* | ~65 | Layer flow, naming, core SQL quality, manifest graph, sources |
| `strict` | ~10 | Documentation contracts, schema YAML beside models, macro/seed docs |
| `enterprise` | ~17 | Ownership meta, PII hints, incremental/snapshot hygiene, mart tests |
| `style` / `phase5` | ~28 | Native SQL formatting (keywords, commas, aliases, whitespace) |
| `bigquery` | ~2 | Adapter-gated warehouse hints (skipped on other adapters) |

See the [Rules reference](/docs/rules) for every rule ID and tag.

## Preset details

### `default`

Runs the **core** rule set: architecture, naming, structure, core documentation, SQL quality, manifest/DAG checks, and configurable governance hooks — without the `strict` documentation bundle, `enterprise` governance tier, or `style` SQL formatting rules.

```ini
preset=default
```

### `strict`

Everything in **default**, plus all `strict`-tagged rules (undocumented models, per-model `schema.yml`, macro/seed documentation, naming contracts, and related checks). SQL style rules stay off. Documentation and architecture categories are elevated to **error** for CI.

```ini
preset=strict
fail_on=error
```

Typical CI: `npx dbt-doctor@latest --preset strict --diff main --fail-on error`.

### `enterprise`

Runs **core**, **strict**, and **enterprise** rules — the full catalog except `style` / `phase5` SQL formatting (use SQLFluff or native style rules individually via `rules.<id>` if needed). Uses **files** scoring and fails on **warnings**. Governance, architecture, and sources categories are stricter.

```ini
preset=enterprise
score_mode=files
fail_on=warning
```

## Overrides

Preset values merge with the rest of your `.dbt-doctor` file; **your keys win** on conflict.

```ini
preset=enterprise
# Still run SQL style rules despite enterprise preset
ignore.tags=
rules.sql-keywords-case=warn
```

To add more ignored tags without replacing the preset list, set `ignore.tags` explicitly (it replaces the preset list for that field — include only what you want skipped).

## Related

- [Configuration](/docs/getting-started/configuration) — full `.dbt-doctor` reference
- [Rules reference](/docs/rules) — per-rule options
- [CI](/docs/getting-started/ci) — GitHub Actions and `--preset`
