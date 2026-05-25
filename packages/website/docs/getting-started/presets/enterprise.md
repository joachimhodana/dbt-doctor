# Enterprise Preset

`preset=enterprise` enables the full lint catalog.

## What it runs

- Core rules
- Strict rules
- Enterprise governance rules
- Native SQL style rules

In practice: all available dbt-doctor rule families (adapter-gated checks still require matching adapter context).

## What it skips

- Nothing by tag

## CI behavior

Enterprise is the strongest enforcement mode and is typically paired with warning-level failure.

Typical CI command:

```bash
npx dbt-doctor@latest --preset enterprise --diff main --fail-on warning
```

## When to use it

- Central platform/data governance programs
- Multi-team dbt estates with shared standards
- Environments where warnings should block merges

## Example `.dbt-doctor`

```ini
preset=enterprise
fail_on=warning
score_mode=files
```
