# Presets

## Overview

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

CLI `--preset` takes priority over the file if both are set.

If `preset` is omitted, dbt-doctor now applies `default` automatically.

## Which preset should I use?

```
New to dbt-doctor?
  └─► preset=default          (core rules only, least noise)

PR checks / docs + SQL style
  └─► preset=strict            (core + documentation + SQL style rules)

Platform / data governance
  └─► preset=enterprise        (all 122 rules, fails on warnings)
```

| You want…                                                                      | Set this            |
| ------------------------------------------------------------------------------ | ------------------- |
| Sensible defaults while adopting dbt-doctor                                    | `preset=default`    |
| Block merges on docs **and** native SQL formatting (`sql-keywords-case`, etc.) | `preset=strict`     |
| Full governance program (meta, sources, DAG, SQL style — everything)           | `preset=enterprise` |

## Overriding

Your `.dbt-doctor` values take precedence over the preset.

```ini
preset=strict
fail_on=warning
```

That keeps strict’s rule set but only fails the job on warnings.
