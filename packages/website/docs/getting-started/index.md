# Getting Started

This section covers setup and first run.

## Install

```bash
pnpm install
pnpm build
```

## Run CLI

```bash
npx dbt-doctor@latest
```

## Configure

1. Add [`.dbt-doctor` configuration](/docs/getting-started/configuration) at the project root.
2. Pick a [preset](/docs/getting-started/presets) (`default`, `strict`, or `enterprise`) to control which rule tiers run in CI.
