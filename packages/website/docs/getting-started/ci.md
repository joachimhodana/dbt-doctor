# CI Integration

## Recommended (GitHub Action)

```yaml
name: dbt-doctor

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read
  pull-requests: write

jobs:
  dbt-doctor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
        with:
          fetch-depth: 0

      - name: dbt Doctor
        uses: joachimhodana/dbt-doctor@0.2.0
        with:
          diff: main
          fail-on: warning
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

## CLI-only alternative

```yaml
name: dbt-doctor-cli

on:
  pull_request:

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: 22

      - run: npx dbt-doctor@latest --diff main --fail-on warning --annotations
```

## Fail behavior

- `--fail-on error`: fail only on errors.
- `--fail-on warning`: fail on errors and warnings.
- `--fail-on none`: never fail.

`--annotations` and PR comments do not fail CI by themselves.

## Useful modes

### Annotations

```bash
npx dbt-doctor@latest --annotations --fail-on warning
```

### SARIF

```bash
npx dbt-doctor@latest --sarif > dbt-doctor.sarif
```

### JSON

```bash
npx dbt-doctor@latest --json > dbt-doctor-report.json
```

## dbt Manifest checks

dbt-doctor can check your project against a `manifest.json` file. It is an optional feature that requires a manifest file to be present (dbt project compiled with `dbt compile` command).

If you want manifest-aware checks:

```bash
npx dbt-doctor@latest --manifest target/manifest.json
```

If manifest is missing, dbt-doctor still runs file-based rules.

To use it within CI without commiting your artifacts, you should generate the manifest ad hoc.

Example:
```yaml
name: dbt-doctor

on:
  pull_request:

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
        with:
          fetch-depth: 0

      - run: dbt compile

      - run: npx dbt-doctor@latest --manifest target/manifest.json --fail-on warning
```