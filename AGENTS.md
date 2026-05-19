# dbt-doctor

Fork of [react-doctor](https://github.com/millionco/react-doctor) adapted for dbt projects (SQL, YAML, Jinja).

## Stack

- pnpm monorepo: `packages/dbt-doctor` (CLI), `@dbt-doctor/core`, `@dbt-doctor/project-info`, `@dbt-doctor/types`, `dbt-doctor-rules`, `packages/website`
- Lint: custom TypeScript rules + optional **sqlfluff** subprocess
- Scoring: local formula in `@dbt-doctor/core`; optional API at `www.dbt.doctor`

## Commands

```bash
pnpm install
pnpm build
pnpm test
pnpm lint
pnpm typecheck
```

## Conventions

- Use `@antfu/ni`: `ni`, `nr`, `nun`
- kebab-case files; arrow functions; interfaces over types
- Magic numbers in `constants.ts` with `SCREAMING_SNAKE_CASE` suffixes
- `// HACK:` prefix for non-obvious workarounds
