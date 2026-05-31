# Getting Started

> **dbt Doctor** is the Swiss-army toolkit for dbt linting.  
> One command to replace fragmented checks across SQL style, dbt graph quality, metadata governance, and CI policy.

| No Python         | No warehouse credentials | Works with dbt Core + dbt Fusion |
| ----------------- | ------------------------ | -------------------------------- |
| Fast local checks | Safe in CI               | Manifest-aware when available    |

## Quick start

```bash
npx dbt-doctor@latest
```

## Why Node instead of Python?

- dbt Doctor was built on top of the `react-doctor` architecture.
- `npx` gives a very low-friction install/run path.
- Most developers already have Node installed, so onboarding is faster.

### Next actions

1. Pick your config style: [Configuration](/docs/getting-started/configuration)
2. Pick your policy level: [Presets](/docs/getting-started/presets)
3. Wire it into CI: [CI Integration](/docs/getting-started/ci)
4. Browse rule catalog: [Rules](/docs/rules)
5. Understand scoring: [Score Modes](/docs/score-modes)

## 60-second setup

### 1. Add a minimal config

Create `.dbt-doctor` in repo root:

```ini
fail_on=error
```

`preset` is optional. If omitted, dbt Doctor uses `default`.

### 2. Run lint

```bash
npx dbt-doctor@latest
```

### 3. Add manifest path (recommended)

```ini
manifest_path=target/manifest.json
```

If manifest is missing, dbt Doctor still runs file-based rules and warns once.

## Choose your rollout

### Local developer mode

```ini
fail_on=none
```

### PR gate mode

```ini
preset=strict
fail_on=warning
diff=main
manifest_path=target/manifest.json
```

### Full governance mode

```ini
preset=enterprise
fail_on=warning
score_mode=files
manifest_path=target/manifest.json
```

## What you get

- SQL linting path compatible with SQLFluff workflows
- dbt graph and manifest checks without requiring `dbt build`
- Rule-level controls for severity, ignores, and options
- Preset-based rollout from quiet to strict

## Continue

- [Configuration](/docs/getting-started/configuration)
- [Presets](/docs/getting-started/presets)
- [CI Integration](/docs/getting-started/ci)
- [Rules](/docs/rules)
- [Score Modes](/docs/score-modes)
