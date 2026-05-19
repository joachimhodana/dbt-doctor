# dbt Doctor benchmarks

Open-source dbt projects scored by [dbt-doctor](https://dbt-doctor.joachimhodana.com). Results live in this repo — no separate benchmarks repository.

## Data file

[`results/leaderboard.json`](results/leaderboard.json) is the source of truth. The website and package README read from it (via sync).

## Add or update a project

1. Run dbt-doctor on the target repo (from a clean checkout):

   ```bash
   npx dbt-doctor@latest /path/to/repo --json -y
   ```

2. Open a PR that adds or updates an entry in `results/leaderboard.json`:

   ```json
   {
     "slug": "dbt-labs-jaffle-shop",
     "name": "jaffle_shop",
     "githubUrl": "https://github.com/dbt-labs/jaffle_shop",
     "packageName": "jaffle_shop",
     "score": 72,
     "errorCount": 3,
     "warningCount": 12,
     "fileCount": 24,
     "commitSha": "abc123...",
     "scannedAt": "2026-05-19T12:00:00.000Z"
   }
   ```

3. After merge, run locally (or let CI run on the next benchmarks change):

   ```bash
   pnpm leaderboard:update
   ```

   This refreshes the README leaderboard table and copies JSON to `packages/website/public/leaderboard.json`.

## Fields

| Field          | Description                             |
| -------------- | --------------------------------------- |
| `slug`         | Stable id (kebab-case, unique)          |
| `name`         | Display name                            |
| `githubUrl`    | Repository URL                          |
| `packageName`  | dbt project name from `dbt_project.yml` |
| `score`        | 0–100 from dbt-doctor                   |
| `errorCount`   | Error diagnostics                       |
| `warningCount` | Warning diagnostics                     |
| `fileCount`    | Files scanned                           |
| `commitSha`    | Git SHA when scanned                    |
| `scannedAt`    | ISO timestamp                           |

When editing the file, bump `generatedAt` and set `doctorVersion` to the dbt-doctor version used for the scan.
