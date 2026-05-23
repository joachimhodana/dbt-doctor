# Presets

A **preset** is a ready-made lint profile. It answers two questions for you:

1. **How many rules should run?** (a small core set, or almost everything)
2. **When should CI fail?** (only on hard errors, or on warnings too)

You set it once in `.dbt-doctor` or on the CLI:

```ini
preset=strict
```

```bash
npx dbt-doctor@latest --preset strict
```

CLI `--preset` overrides the file if both are set.

## Which preset should I use?

```
New to dbt-doctor?
  └─► preset=default          (core rules only, least noise)

PR checks / docs + SQL style
  └─► preset=strict            (core + documentation + SQL style rules)

Platform / data governance
  └─► preset=enterprise        (all 122 rules, fails on warnings)

Same rules as enterprise, but you choose fail_on / score_mode yourself
  └─► omit preset              (no preset line in .dbt-doctor)
```

| You want… | Set this |
| --- | --- |
| Sensible defaults while adopting dbt-doctor | `preset=default` |
| Block merges on docs **and** native SQL formatting (`sql-keywords-case`, etc.) | `preset=strict` |
| Full governance program (meta, sources, DAG, SQL style — everything) | `preset=enterprise` |
| All rules with your own `fail_on` / `score_mode` | *no* `preset` line |

## The three presets (plain English)

Think of rules in **layers**. Each preset turns on more layers.

```text
  enterprise / omit preset   All 122 rules (incl. SQL style + enterprise)
                    ┌─────────────────────────────────────┐
  strict            │  + strict documentation (~10)       │
                    │  + SQL style / phase5 (~28)         │
                    ├─────────────────────────────────────┤
  default           │  Core rules only (~65)              │
                    └─────────────────────────────────────┘
```

### `default` — start here

**Runs:** Core rules only — layering (`staging` → `marts`), naming, manifest/DAG checks, `SELECT *`, hard-coded refs, etc.

**Skips:** Documentation-contract rules, enterprise governance rules, and SQL formatting rules.

**CI:** Does not change `fail_on` for you. Use your normal `--fail-on error` (default CLI behavior).

```ini
preset=default
```

Good for local development and teams onboarding to dbt-doctor.

### `strict` — PR checks (docs + SQL style)

**Runs:** Everything in `default`, **plus** `strict`-tagged documentation rules **and** native SQL style rules (`style` / `phase5` — keyword case, commas, aliases, etc.).

**Skips:** Only enterprise governance rules (meta programs, PII hints, mart test nudges, etc.).

**CI:** Sets `fail_on=error`. Documentation, Configuration, and Architecture categories count as errors; SQL Style stays at warn unless you override individual rules.

```ini
preset=strict
```

Typical PR command:

```bash
npx dbt-doctor@latest --preset strict --diff main
```

### `enterprise` — full catalog

**Runs:** **All 122 rules** — core, strict, enterprise, and SQL style. Same rule set as omitting `preset`; the difference is built-in CI strictness.

**Skips:** Nothing (adapter-gated rules like BigQuery hints still only run on matching adapters).

**CI:** Sets `fail_on=warning` and `score_mode=files`, so **any warning fails the job** and scoring weights file volume.

```ini
preset=enterprise
```

## Important: `preset=default` is not the same as “no preset”

| Config | Rules that run |
| --- | --- |
| No `preset` line | **All 122** rules (you set `fail_on` yourself) |
| `preset=default` | **~65** core rules (quieter) |
| `preset=strict` | **~93** rules (core + docs + SQL style) |
| `preset=enterprise` | **All 122** rules |

If scans feel too noisy, use `preset=default`. For SQL formatting in CI without enterprise governance, use `preset=strict`.

## What “error” vs “warn” means

Each rule has a built-in severity:

- **16 rules** are **error** by default (broken DAG, `SELECT *`, empty model files, missing `unique_key`, etc.)
- **106 rules** are **warn** by default (docs, style hints, performance nudges)

Presets do **not** change those built-in severities. They mainly control **which rules run at all** (via tag filters).

Presets can also **re-label** findings by category (e.g. `strict` bumps Documentation to error in output and for `--fail-on`).

Override any single rule in `.dbt-doctor`:

```ini
rules.no-select-star=warn
rules.undocumented-model=error
```

See [Rules reference](/docs/rules) for IDs.

## How presets filter rules (tags)

Under the hood, presets set `ignore.tags` — a list of rule **tags** to skip.

| Tag | What kind of rules |
| --- | --- |
| *(no tag)* | Core architecture, naming, manifest, most SQL quality |
| `strict` | Extra documentation / contract checks |
| `enterprise` | Governance, ownership, PII hints, mart tests |
| `style` / `phase5` | SQL formatting (keyword case, commas, etc.) |

A rule is skipped if it has **any** ignored tag.

| Preset | Ignored tags |
| --- | --- |
| `default` | `enterprise`, `strict`, `style`, `phase5` |
| `strict` | `enterprise` only |
| `enterprise` | *(none)* |

To skip SQL style again while on `strict` or `enterprise`:

```ini
preset=strict
ignore.tags=enterprise,style
```

Setting `ignore.tags=` **replaces** the preset list entirely.

## Overrides

Your `.dbt-doctor` values win over the preset. The preset is applied first, then your file is merged on top.

```ini
preset=strict
fail_on=warning
```

That keeps strict’s rule set but only fails the job on warnings you configure.

## Related

- [Configuration](/docs/getting-started/configuration) — all `.dbt-doctor` keys
- [Rules reference](/docs/rules) — every rule ID
- [CI](/docs/getting-started/ci) — GitHub Actions examples
