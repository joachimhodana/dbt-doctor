# dbt-doctor-rules

Custom lint rules for [dbt-doctor](https://github.com/joachimhodana/dbt-doctor): dbt project structure, naming, documentation, sources, and SQL architecture.

Used by the CLI (`runCustomRules`) with native SQL parser rules by default and optional [sqlfluff](https://docs.sqlfluff.com/) via `--use-sqlfluff`.

## Rule catalog

See **[RULES.md](./RULES.md)** for the full rule catalog, tag tiers, and competitive coverage vs [dbt_project_evaluator](https://dbt-labs.github.io/dbt-project-evaluator/latest/), [dbt_meta_testing](https://hub.getdbt.com/tnightengale/dbt_meta_testing/latest/), and SQLFluff.

Native SQLFluff parity for layout/style codes is tracked in **[`sqlfluff-parity.json`](./sqlfluff-parity.json)**. Website coverage summaries: [Tool parity](https://dbt-doctor.joachimhodana.com/docs/tool-parity).

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
