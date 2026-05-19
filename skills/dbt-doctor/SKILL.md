---
name: dbt-doctor
description: Use when finishing dbt model work, before committing SQL/YAML, or when improving analytics code quality. Checks for score regression on dbt projects.
version: "1.0.0"
---

# dbt Doctor

Scans dbt projects for SQL quality, documentation, naming, sources, and architecture issues. Outputs a 0–100 health score.

## After making dbt changes

Run `npx dbt-doctor@latest --verbose --diff` and check the score did not regress.

## Command

```bash
npx dbt-doctor@latest --verbose --diff
```

| Flag        | Purpose                                       |
| ----------- | --------------------------------------------- |
| `.`         | Scan current directory                        |
| `--verbose` | Show affected files and line numbers per rule |
| `--diff`    | Only scan changed files vs base branch        |
| `--score`   | Output only the numeric score                 |
| `--offline` | Local score only (no API)                     |

Requires Python + `sqlfluff` for full SQL linting: `pip install sqlfluff sqlfluff-templater-dbt`
