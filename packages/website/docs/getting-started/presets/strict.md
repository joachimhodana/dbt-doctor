# Strict Preset

`preset=strict` is the PR-grade profile for docs and SQL style discipline.

## What it runs

Everything in `default`, plus:

- `strict` documentation / contract checks
- Native SQL style rules (`style`, `sql-style`)

## What it skips

- `enterprise` tagged rules

## CI behavior

Strict preset is designed for merge protection.

Typical CI command:

```bash
npx dbt-doctor@latest --preset strict --diff main --fail-on error
```

## When to use it

- PR checks for production analytics repos
- Teams that want SQL style + docs quality enforced
- Pipelines where warnings are informational and errors block

## Example `.dbt-doctor`

```ini
preset=strict
fail_on=error
```
