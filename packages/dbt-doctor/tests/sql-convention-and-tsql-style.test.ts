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

describe("sql convention and tsql style", () => {
  let directory: string;

  afterEach(() => {
    if (directory) fs.rmSync(directory, { recursive: true, force: true });
  });

  it("flags CV06-CV09 and CV11 convention issues", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-cv-style-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "models/marts/fct_orders.sql",
      [
        "select ifnull(col, 'null') as v, nvl(col, 'x') as w",
        "from orders",
        "where true and amount between symmetric 1 and 10 and status = ''",
      ].join("\n"),
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    });

    expect(diagnostics.some((d) => d.rule === "sql-null-literal-style")).toBe(true);
    expect(diagnostics.some((d) => d.rule === "sql-boolean-literal-style")).toBe(true);
    expect(diagnostics.some((d) => d.rule === "sql-coalesce-preferred")).toBe(true);
    expect(diagnostics.some((d) => d.rule === "sql-between-symmetric-style")).toBe(true);
    expect(diagnostics.some((d) => d.rule === "sql-zero-length-string-style")).toBe(true);
  });

  it("flags TQ01-TQ03 conventions", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-tq-style-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "models/marts/fct_orders.sql",
      [
        "create procedure sp_my_proc as",
        "select * from objects",
        "select * into #tmp from orders",
      ].join("\n"),
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    });

    expect(diagnostics.some((d) => d.rule === "sql-tsql-sp-prefix")).toBe(true);
    expect(diagnostics.some((d) => d.rule === "sql-tsql-bare-temp-table")).toBe(true);
    expect(diagnostics.some((d) => d.rule === "sql-tsql-sys-schema-qualified")).toBe(true);
  });
});
