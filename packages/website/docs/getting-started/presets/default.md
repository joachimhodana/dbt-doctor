# Default Preset

`preset=default` is the quiet, onboarding-friendly profile.

## What it runs

- Core architecture and layering checks
- Core naming and path checks
- Core SQL quality checks
- Manifest-aware rules when manifest is present

## What it skips

- `strict` tagged rules
- `enterprise` tagged rules
- SQL style tags (`style`, `sql-style`)

## CI behavior

`default` does not force a custom failure mode by itself.

Typical CI command:

```bash
npx dbt-doctor@latest --preset default --diff main --fail-on error
```

## When to use it

- First rollout in an existing dbt project
- Teams that want architectural protection with minimal noise
- Local developer feedback loops

## Example `.dbt-doctor`

```ini
preset=default
fail_on=error
```
