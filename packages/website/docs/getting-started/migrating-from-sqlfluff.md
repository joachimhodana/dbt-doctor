# Migrating from SQLFluff

dbt-doctor ships native SQL and Jinja rules that cover the [SQLFluff stable rule bundle](/docs/tool-parity/sqlfluff). You can run them without Python when `skip_sqlfluff=true` (the default).

## Recommended preset mapping

| SQLFluff setup                | dbt-doctor preset                                  |
| ----------------------------- | -------------------------------------------------- |
| Light / layout only in CI     | `preset=default` (SQL style rules are off)         |
| Full SQLFluff in CI           | `preset=strict` (enables `sql-style` tagged rules) |
| SQLFluff + project governance | `preset=enterprise`                                |

```ini
preset=strict
fail_on=warning
skip_sqlfluff=true
```

## Differences to expect

### Trailing semicolons

SQLFluff often expects a terminator semicolon (`LT12`). dbt models usually should **not** end with `;`.

- SQLFluff: `LT12` — add semicolon
- dbt-doctor: [`script-semicolon`](/docs/rules#script-semicolon) — remove trailing semicolon

### SQL style is opt-in via preset

Native formatting rules (`sql-keywords-case`, `sql-leading-commas`, etc.) use the `sql-style` tag. They run with `preset=strict` or `preset=enterprise`, not with `preset=default`.

### Optional SQLFluff subprocess

Keep SQLFluff as a second pass when you need exact upstream rule codes or dialect packs dbt-doctor does not model yet:

```ini
skip_sqlfluff=false
adopt_existing_sqlfluff_config=true
```

```bash
npx dbt-doctor@latest --use-sqlfluff
```

## Disable specific native rules

```ini
preset=strict
ignore.rules=sql-keywords-case,sql-trailing-whitespace
```

Or tune per rule:

```ini
rules.sql-keywords-case=warn
rules.sql-keywords-case.capitalisationPolicy=upper
```

## Related

- [Tool parity: SQLFluff](/docs/tool-parity/sqlfluff)
- [Presets](/docs/getting-started/presets)
- [Configuration](/docs/getting-started/configuration)
