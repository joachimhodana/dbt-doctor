# Score Modes

Project score is always `0-100`. The score is computed from three penalty buckets:

- Rule variety penalty (unique rules hit)
- File spread penalty (only in `files` mode)
- Finding volume penalty (total diagnostic count)

## Formula

```text
score = max(0, round(100 - rulePenalty - filesPenalty - findingsPenalty))
```

Where:

- `rulePenalty = (unique_error_rules * 1.5) + (unique_warning_rules * 0.75)`
- `filesPenalty = round((affectedFiles / totalFilesScanned) * 40)` in `files` mode, else `0`
- `findingsPenalty = min(15, floor(totalFindings / 7))`

## Labels

- `Great` for score `>= 75`
- `Needs work` for score `>= 50` and `< 75`
- `Critical` for score `< 50`

## Modes

- [Files mode](/docs/score-modes/files): default, penalizes how broadly issues are spread across files.
- [Unique-rules mode](/docs/score-modes/unique-rules): ignores file spread, focuses on rule diversity + finding volume.

## Configuration

In `.dbt-doctor`:

```ini
score_mode=files
```

or:

```ini
score_mode=unique-rules
```

CLI override:

```bash
npx dbt-doctor@latest --score-mode files
```
