# dbt-doctor-rules

[![version](https://img.shields.io/npm/v/dbt-doctor-rules?style=flat&colorA=000000&colorB=000000)](https://npmjs.com/package/dbt-doctor-rules)
[![downloads](https://img.shields.io/npm/dt/dbt-doctor-rules.svg?style=flat&colorA=000000&colorB=000000)](https://npmjs.com/package/dbt-doctor-rules)

[oxlint](https://oxc.rs/docs/guide/usage/linter) plugin for [React Doctor](https://dbt.doctor). Diagnoses React codebases for security, performance, correctness, accessibility, bundle-size, and architecture issues.

This package owns the rule implementations (178 rules across architecture, performance, correctness, security, accessibility, bundle-size, and framework-specific buckets). [`dbt-doctor-rules`](https://npmjs.com/package/dbt-doctor-rules) wraps these same rules for ESLint, and the full diagnostic CLI lives in [`dbt-doctor`](https://npmjs.com/package/dbt-doctor).

## Install

```bash
npm install --save-dev oxlint dbt-doctor-rules
```

```bash
pnpm add -D oxlint dbt-doctor-rules
```

```bash
yarn add -D oxlint dbt-doctor-rules
```

## Usage

In `.oxlintrc.json`:

```jsonc
{
  "jsPlugins": [{ "name": "dbt-doctor", "specifier": "dbt-doctor-rules" }],
  "rules": {
    "dbt-doctor/no-fetch-in-effect": "warn",
    "dbt-doctor/no-derived-state-effect": "warn",
  },
}
```

Run oxlint as normal:

```bash
npx oxlint .
```

## Available rules

The full rule list lives in [`oxlint-config.ts`](https://github.com/joachimhodana/dbt-doctor/blob/main/packages/dbt-doctor/src/oxlint-config.ts). All rules are namespaced under `dbt-doctor/*`.

Each rule can be set to `"error"`, `"warn"`, or `"off"`:

```jsonc
{
  "rules": {
    "dbt-doctor/no-cascading-set-state": "error",
    "dbt-doctor/no-array-index-as-key": "warn",
  },
}
```

## Want the CLI too?

This package only ships the oxlint plugin. To run React Doctor's full scan (with scoring, JSON reports, agent integration, etc.), use the main CLI:

```bash
npx dbt-doctor@latest
```

See the [React Doctor README](https://github.com/joachimhodana/dbt-doctor#readme) for the full feature set.

## License

MIT
