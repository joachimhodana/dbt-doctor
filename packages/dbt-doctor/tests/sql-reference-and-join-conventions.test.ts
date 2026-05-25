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

describe("sql reference and join conventions", () => {
  let directory: string;

  afterEach(() => {
    if (directory) fs.rmSync(directory, { recursive: true, force: true });
  });

  it("flags reference quoting and ordinal order usage", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-ref-quote-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "models/marts/fct_orders.sql",
      [
        'select "id" from select',
        "join raw-order on 1=1",
        "order by 1",
      ].join("\n"),
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    });

    expect(diagnostics.some((d) => d.rule === "sql-reference-keyword-quoted")).toBe(true);
    expect(diagnostics.some((d) => d.rule === "sql-reference-special-chars-quoted")).toBe(true);
    expect(diagnostics.some((d) => d.rule === "sql-reference-unnecessary-quoted")).toBe(true);
    expect(diagnostics.some((d) => d.rule === "sql-order-by-ordinal-unambiguous")).toBe(true);
  });

  it("flags join using style", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-join-using-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "models/marts/fct_orders.sql",
      ["select o.id", "from orders o", "join customers c using (customer_id)"].join("\n"),
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    });
    expect(diagnostics.some((d) => d.rule === "sql-join-using-consistency")).toBe(true);
  });
});
