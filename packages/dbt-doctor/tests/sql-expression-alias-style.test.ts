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

describe("sql expression alias style", () => {
  let directory: string;

  afterEach(() => {
    if (directory) fs.rmSync(directory, { recursive: true, force: true });
  });

  it("flags expression targets without alias", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-expression-alias-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "models/marts/fct_orders.sql",
      "select id, sum(amount), coalesce(status, 'new') as status_name from orders\n",
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    }).filter((diagnostic) => diagnostic.rule === "sql-expression-alias-required");

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.message).toContain("sum(amount)");
  });

  it("does not flag simple references or aliased expressions", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-expression-alias-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "models/marts/fct_orders.sql",
      "select id, sum(amount) as total_amount, customer.name from orders\n",
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    }).filter((diagnostic) => diagnostic.rule === "sql-expression-alias-required");

    expect(diagnostics).toHaveLength(0);
  });
});
