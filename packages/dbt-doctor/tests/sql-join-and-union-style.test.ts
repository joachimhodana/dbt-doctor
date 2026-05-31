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

describe("sql join and union style", () => {
  let directory: string;

  afterEach(() => {
    if (directory) fs.rmSync(directory, { recursive: true, force: true });
  });

  it("flags comma joins in FROM clauses", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-sql-join-union-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "models/marts/fct_orders.sql",
      "select a.id from orders a, customers c where a.customer_id = c.id\n",
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    }).filter((diagnostic) => diagnostic.rule === "sql-no-comma-join");

    expect(diagnostics.length).toBeGreaterThan(0);
  });

  it("flags UNION DISTINCT redundancy", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-sql-join-union-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "models/marts/fct_union.sql",
      "select 1 as id union distinct select 2 as id\n",
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    }).filter((diagnostic) => diagnostic.rule === "sql-union-distinct-redundant");

    expect(diagnostics).toHaveLength(1);
  });
});
