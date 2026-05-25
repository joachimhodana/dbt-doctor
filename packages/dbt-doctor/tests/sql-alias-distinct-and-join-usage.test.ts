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

describe("sql alias distinct and join usage", () => {
  let directory: string;

  afterEach(() => {
    if (directory) fs.rmSync(directory, { recursive: true, force: true });
  });

  it("flags duplicate column aliases and derived table without alias", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-alias-derived-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "models/marts/fct_orders.sql",
      ["select o.id as x, o.status as x", "from (select id, status from orders)"].join("\n"),
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    });

    expect(diagnostics.some((d) => d.rule === "sql-unique-column-aliases")).toBe(true);
    expect(diagnostics.some((d) => d.rule === "sql-derived-table-alias-required")).toBe(true);
  });

  it("flags distinct parentheses and constant expression", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-distinct-constant-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "models/marts/fct_orders.sql",
      ["select distinct(id) from orders", "where 1 = 1"].join("\n"),
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    });
    expect(diagnostics.some((d) => d.rule === "sql-distinct-parentheses")).toBe(true);
    expect(diagnostics.some((d) => d.rule === "sql-constant-expression")).toBe(true);
  });

  it("flags unused join alias", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-unused-join-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "models/marts/fct_orders.sql",
      ["select o.id", "from orders o", "left join customers c on o.customer_id = c.id"].join("\n"),
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    });
    expect(diagnostics.some((d) => d.rule === "sql-unused-join-alias")).toBe(true);
  });
});
