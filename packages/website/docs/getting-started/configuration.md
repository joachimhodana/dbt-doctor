# Configuration

Create a `.dbt-doctor` file in your dbt project root.

Format: `KEY=value` (`#` comments allowed).

CLI flags override file values.

## Minimal starter

```ini
preset=default
fail_on=error
```

## Common setups

### PR checks (recommended)

```ini
preset=strict
fail_on=warning
diff=main
manifest_path=target/manifest.json
```

### Full governance

```ini
preset=enterprise
fail_on=warning
score_mode=files
```

### Local-only fast mode

```ini
preset=default
fail_on=none
```

## SQL mode

Native SQL rules are enabled by default.

### Native only (no Python)

```ini
skip_sqlfluff=true
```

### Use SQLFluff too

```ini
skip_sqlfluff=false
adopt_existing_sqlfluff_config=true
```

## Most-used keys

| Key                   | Values                            | Purpose                      |
| --------------------- | --------------------------------- | ---------------------------- |
| `preset`              | `default`, `strict`, `enterprise` | Rule bundle                  |
| `fail_on`             | `error`, `warning`, `none`        | CI exit behavior             |
| `diff`                | `true` or branch name             | Changed-files scan           |
| `manifest_path`       | file path                         | Enable manifest-aware checks |
| `score_mode`          | `files`, `unique-rules`           | Score formula                |
| `ignore.rules`        | comma list                        | Skip specific rules          |
| `ignore.files`        | glob list                         | Skip all rules on files      |
| `ignore.tags`         | comma list                        | Skip rule families           |
| `rules.<id>`          | `error`, `warn`, `off`            | Override one rule severity   |
| `rules.<id>.<option>` | string/number/bool/list           | Per-rule options             |

## Preset behavior

- If `preset` is omitted, dbt-doctor uses `default`.
- `strict` = `default` + docs + SQL style checks.
- `enterprise` = full catalog.

See [Presets](/docs/getting-started/presets) for details.

## Focused override example

```ini
preset=strict
fail_on=warning

# Temporary legacy suppression
ignore.files=models/legacy/**

# Promote a specific rule
rules.no-select-star=error

# Rule-specific option
rules.model-name-contract.pattern=^(stg|int|fct|dim)_[a-z0-9_]+$
```

## Related

- [CI](/docs/getting-started/ci)
- [Presets](/docs/getting-started/presets)
- [Score Modes](/docs/score-modes)
- [Rules](/docs/rules)
