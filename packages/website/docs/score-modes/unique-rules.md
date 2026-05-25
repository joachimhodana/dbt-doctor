# Unique-Rules Mode

`unique-rules` removes file spread from scoring.

Use this when you want score to focus on rule diversity and total finding volume, not how many files were hit.

## Penalties used

- Rule variety penalty
- Finding volume penalty
- File spread penalty is always `0`

## Example calculation

Using the same diagnostics as the files-mode example:

- `18` total findings
- `3` unique error rules
- `4` unique warning rules
- `9` affected files
- `30` total files scanned

Step 1, rule penalty:

```text
(3 * 1.5) + (4 * 0.75) = 7.5
```

Step 2, files penalty:

```text
0
```

Step 3, findings penalty:

```text
min(15, floor(18 / 7)) = 2
```

Step 4, final score:

```text
max(0, round(100 - 7.5 - 0 - 2)) = round(90.5) = 91
```

Label: `Great`.

## Why choose unique-rules mode

- Stable score in diff-only or partial scans
- Less sensitive to monorepo file-count skew
- Most of the time, it's better to stick to `files` mode.
