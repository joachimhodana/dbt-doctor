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
  └─► preset=default          (fewer rules, less noise)

PR checks / “docs must be complete”
  └─► preset=strict            (adds documentation rules, fails on errors)

Platform / data governance team
  └─► preset=enterprise        (almost all rules, fails on warnings too)

Want every rule including SQL formatting?
  └─► omit preset              (no preset line in .dbt-doctor)
```

| You want… | Set this |
| --- | --- |
| Sensible defaults while adopting dbt-doctor | `preset=default` |
| Block merges when models lack docs / schema YAML | `preset=strict` |
| Strong governance (meta, sources, DAG) without 28 SQL style rules | `preset=enterprise` |
| Full audit including SQL style (`sql-keywords-case`, etc.) | *no* `preset` line |

## The three presets (plain English)

Think of rules in **layers**. Each preset turns on more layers.

```text
                    ┌─────────────────────────────────────┐
  omit preset       │  All 122 rules (incl. SQL style)    │
                    └─────────────────────────────────────┘
                    ┌─────────────────────────────────────┐
  enterprise        │  + enterprise governance (~17)      │
                    ├─────────────────────────────────────┤
  strict            │  + strict documentation (~10)       │
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

### `strict` — documentation-focused CI

**Runs:** Everything in `default`, **plus** rules tagged `strict` (e.g. undocumented models, per-model `schema.yml`, macro/seed docs).

**Skips:** Enterprise governance rules and SQL formatting rules.

**CI:** Sets `fail_on=error` and treats Documentation / Configuration / Architecture findings as errors (even if the rule itself defaults to warn).

```ini
preset=strict
```

Typical PR command:

```bash
npx dbt-doctor@latest --preset strict --diff main
```

### `enterprise` — governance without SQL style noise

**Runs:** Core + strict + enterprise rules (~91 rules). Covers meta keys, source hygiene, exposure checks, incremental/snapshot config, etc.

**Skips:** Only SQL **style** rules (commas, keyword case, indentation — 28 rules). Enable those separately if you want them.

**CI:** Sets `fail_on=warning` and `score_mode=files`, so **any warning fails the job** and scoring weights file volume.

```ini
preset=enterprise
```

## Important: `preset=default` is not the same as “no preset”

| Config | Rules that run |
| --- | --- |
| No `preset` line | **All 122** rules |
| `preset=default` | **~65** core rules (quieter) |

If scans feel too noisy, use `preset=default`. If you want the full catalog, remove the `preset` line.

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

A rule is skipped if it has **any** ignored tag. Example: `preset=default` ignores `enterprise`, `strict`, and `style`, so only untagged core rules run.

You rarely need to touch tags directly. If you do:

```ini
preset=enterprise
# Run SQL style rules too (clears the preset's style ignore list)
ignore.tags=
```

Setting `ignore.tags=` **replaces** the preset list entirely — include only tags you still want skipped.

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
