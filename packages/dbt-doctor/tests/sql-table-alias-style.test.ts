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

describe("sql table alias style", () => {
  let directory: string;

  afterEach(() => {
    if (directory) fs.rmSync(directory, { recursive: true, force: true });
  });

  it("flags duplicate aliases", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-table-alias-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "models/marts/fct_orders.sql",
      ["select o.id", "from orders o", "join customers o on o.id = o.id"].join("\n"),
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    }).filter((diagnostic) => diagnostic.rule === "sql-unique-table-aliases");

    expect(diagnostics.length).toBeGreaterThan(0);
  });

  it("does not flag unique aliases", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-table-alias-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "models/marts/fct_orders.sql",
      ["select o.id, c.id", "from orders o", "join customers c on o.customer_id = c.id"].join("\n"),
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    }).filter((diagnostic) => diagnostic.rule === "sql-unique-table-aliases");

    expect(diagnostics).toHaveLength(0);
  });
});
