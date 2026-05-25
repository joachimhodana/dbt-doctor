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

describe("sql alias set and semicolon style", () => {
  let directory: string;

  afterEach(() => {
    if (directory) fs.rmSync(directory, { recursive: true, force: true });
  });

  it("flags short table alias and implicit join type", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-alias-join-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "models/marts/fct_orders.sql",
      ["select *", "from orders o", "join customers c on o.customer_id = c.id"].join("\n"),
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    });

    expect(diagnostics.some((d) => d.rule === "sql-alias-length-min")).toBe(true);
    expect(diagnostics.some((d) => d.rule === "sql-ambiguous-join-type")).toBe(true);
  });

  it("flags set operator with mismatched projected column count", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-set-count-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "models/marts/fct_orders.sql",
      ["select id, status from orders", "union all", "select id from customers"].join("\n"),
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    });
    expect(diagnostics.some((d) => d.rule === "sql-set-operator-column-count-match")).toBe(true);
  });

  it("flags potential join predicate in WHERE clause", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-join-where-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "models/marts/fct_orders.sql",
      [
        "select *",
        "from orders o",
        "join customers c",
        "where o.customer_id = c.id",
      ].join("\n"),
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    });
    expect(diagnostics.some((d) => d.rule === "sql-join-condition-in-on-clause")).toBe(true);
  });

  it("flags consecutive semicolons", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-semicolons-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(directory, "models/marts/fct_orders.sql", "select 1;;");

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    });
    expect(diagnostics.some((d) => d.rule === "sql-no-consecutive-semicolons")).toBe(true);
  });
});
