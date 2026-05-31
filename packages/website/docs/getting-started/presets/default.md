# Default Preset

`preset=default` is the quiet, onboarding-friendly profile.

## What it runs

- Core architecture and layering checks
- Core naming and path checks
- Core SQL quality checks
- Manifest-aware rules when manifest is present

## What it skips

- `strict` tagged rules (docs contracts, dbt-checkpoint parity, Jinja padding, etc.)
- `enterprise` tagged rules (governance meta, catalog column checks, etc.)
- SQL style tags (`style`, `sql-style`) — native SQLFluff-parity formatting

Only **untagged** core rules run on `default` (architecture, naming, `no-select-star`, and similar).

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
