# Files Mode

`files` is the default score mode.

Use this when you want score to reflect blast radius: the more files touched by problems, the bigger the penalty.

## Penalties used

- Rule variety penalty
- File spread penalty
- Finding volume penalty

## Example calculation

Assume a scan produced:

- `18` total findings
- `3` unique error rules
- `4` unique warning rules
- Findings across `9` affected files
- `30` total files scanned

Step 1, rule penalty:

```text
(3 * 1.5) + (4 * 0.75) = 4.5 + 3.0 = 7.5
```

Step 2, files penalty:

```text
round((9 / 30) * 40) = round(12) = 12
```

Step 3, findings penalty:

```text
min(15, floor(18 / 7)) = min(15, 2) = 2
```

Step 4, final score:

```text
max(0, round(100 - 7.5 - 12 - 2)) = round(78.5) = 79
```

Label: `Great`.

## Why choose files mode

- Better PR quality signal in larger projects
- Penalizes broad hygiene drift, not just repeated issues in one file
- Better fit for governance gates like `fail_project_under`
