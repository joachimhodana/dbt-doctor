# dbt-doctor-rules

Custom lint rules for [dbt-doctor](https://github.com/joachimhodana/dbt-doctor): dbt project structure, naming, documentation, sources, and SQL architecture.

Used by the CLI (`runCustomRules`) alongside optional [sqlfluff](https://docs.sqlfluff.com/) for SQL style.

## Rule catalog

See **[RULES.md](./RULES.md)** for the full list, severity levels, and mapping to dbt Labs / dbt_project_evaluator guidance.

## Usage

```ts
import { runCustomRules } from "dbt-doctor-rules";
import { discoverProject } from "@dbt-doctor/project-info";

const project = discoverProject("/path/to/dbt/project");
const diagnostics = runCustomRules({
  rootDirectory: "/path/to/dbt/project",
  project,
  ignoredTags: new Set(),
});
```

## License

MIT
