import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { runCustomRules } from "dbt-doctor-rules";
import { discoverProject } from "@dbt-doctor/project-info";

const writeFile = (rootDir: string, relativePath: string, body: string): void => {
  const filePath = path.join(rootDir, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, body);
};

describe("sql next five style", () => {
  let directory: string;

  afterEach(() => {
    if (directory) fs.rmSync(directory, { recursive: true, force: true });
  });

  it("flags self alias, boolean compare, positional group/order, else null, multi statement", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-next-five-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "models/marts/fct_orders.sql",
      [
        "select id as id, case when status = 'x' then 1 else null end as bucket",
        "from orders",
        "where is_active = true",
        "group by 1",
        "order by 1;",
        "select 2 as extra",
      ].join("\n"),
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    });

    expect(diagnostics.some((d) => d.rule === "sql-no-self-alias")).toBe(true);
    expect(diagnostics.some((d) => d.rule === "sql-boolean-comparison-simplify")).toBe(true);
    expect(diagnostics.some((d) => d.rule === "sql-no-positional-group-order")).toBe(true);
    expect(diagnostics.some((d) => d.rule === "sql-no-else-null-case")).toBe(true);
    expect(diagnostics.some((d) => d.rule === "sql-single-statement-model")).toBe(true);
  });
});
