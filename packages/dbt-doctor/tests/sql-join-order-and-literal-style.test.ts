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

describe("sql join order and literal style", () => {
  let directory: string;

  afterEach(() => {
    if (directory) fs.rmSync(directory, { recursive: true, force: true });
  });

  it("flags self join alias reuse", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-self-join-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "models/marts/fct_orders.sql",
      ["select *", "from orders o", "join orders o on o.id = o.id"].join("\n"),
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    });
    expect(diagnostics.some((d) => d.rule === "sql-self-join-alias-distinct")).toBe(true);
  });

  it("flags ambiguous order by target", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-order-by-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "models/marts/fct_orders.sql",
      [
        "select o.id as x, c.id as x",
        "from orders o",
        "join customers c on o.customer_id = c.id",
        "order by x",
      ].join("\n"),
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    });
    expect(diagnostics.some((d) => d.rule === "sql-ambiguous-order-by-target")).toBe(true);
  });

  it("flags double quoted string literals", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-quoted-literal-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "models/marts/fct_orders.sql",
      ['select "foo bar" as name from orders'].join("\n"),
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    });
    expect(diagnostics.some((d) => d.rule === "sql-quoted-literal-style")).toBe(true);
  });

  it("flags distinct with non-positional order by expression", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-distinct-order-by-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "models/marts/fct_orders.sql",
      ["select distinct id from orders", "order by created_at"].join("\n"),
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    });
    expect(diagnostics.some((d) => d.rule === "sql-distinct-with-order-by-non-selected")).toBe(
      true,
    );
  });

  it("flags join without ON/USING predicate", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-join-condition-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "models/marts/fct_orders.sql",
      ["select *", "from orders o", "join customers c"].join("\n"),
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    });
    expect(diagnostics.some((d) => d.rule === "sql-join-condition-required")).toBe(true);
  });
});
