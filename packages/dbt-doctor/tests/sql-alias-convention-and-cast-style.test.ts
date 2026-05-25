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

describe("sql alias convention and cast style", () => {
  let directory: string;

  afterEach(() => {
    if (directory) fs.rmSync(directory, { recursive: true, force: true });
  });

  it("flags keyword aliases and lowercase cast type", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-alias-keyword-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "models/marts/fct_orders.sql",
      ["select cast(id as string) as select from orders"].join("\n"),
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    });

    expect(diagnostics.some((d) => d.rule === "sql-alias-not-keyword")).toBe(true);
    expect(diagnostics.some((d) => d.rule === "sql-data-type-case")).toBe(true);
  });

  it("flags count(1), mixed cast style, and distinct order mismatch", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-count-cast-distinct-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "models/marts/fct_orders.sql",
      [
        "select distinct id, count(1) as cnt, cast(id as INT) as id_int, id::INT as id_int2",
        "from orders",
        "group by id, id::INT",
        "order by created_at",
      ].join("\n"),
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    });

    expect(diagnostics.some((d) => d.rule === "sql-count-star-preferred")).toBe(true);
    expect(diagnostics.some((d) => d.rule === "sql-cast-style-consistency")).toBe(true);
    expect(diagnostics.some((d) => d.rule === "sql-order-by-distinct-compatibility")).toBe(true);
  });
});
