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

describe("phase5 native sql style rules", () => {
  let directory: string;

  afterEach(() => {
    if (directory) fs.rmSync(directory, { recursive: true, force: true });
  });

  it("flags mixed keyword capitalization using parser-backed keyword traversal", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-sql-style-"));

    writeFile(
      directory,
      "dbt_project.yml",
      'name: sql_style_fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(directory, "models/staging/stg_orders.sql", "select id FROM raw_orders\n");

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    }).filter((diagnostic) => diagnostic.rule === "sql-keywords-case");

    expect(diagnostics.length).toBeGreaterThan(0);
    expect(diagnostics.some((diagnostic) => diagnostic.message.includes("Keyword \"FROM\""))).toBe(true);
  });

  it("flags leading commas by default in trailing-comma mode", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-sql-style-"));

    writeFile(
      directory,
      "dbt_project.yml",
      'name: sql_style_fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(directory, "models/staging/stg_orders.sql", "select\n  id\n, order_id\nfrom raw_orders\n");

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    }).filter((diagnostic) => diagnostic.rule === "sql-trailing-commas");

    expect(diagnostics.length).toBeGreaterThan(0);
  });

  it("flags trailing commas when leading-comma mode is explicitly enabled", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-sql-style-"));

    writeFile(
      directory,
      "dbt_project.yml",
      'name: sql_style_fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(directory, "models/staging/stg_orders.sql", "select\n  id,\n  order_id\nfrom raw_orders\n");

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
      ruleConfig: {
        "sql-leading-commas": {
          enabled: true,
        },
      },
    }).filter((diagnostic) => diagnostic.rule === "sql-leading-commas");

    expect(diagnostics.length).toBeGreaterThan(0);
  });

  it("uses parser semantics for no-select-star and ignores count(*)", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-sql-style-"));

    writeFile(
      directory,
      "dbt_project.yml",
      'name: sql_style_fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "models/staging/stg_orders.sql",
      "select count(*) as row_count, id from raw_orders\n",
    );
    writeFile(
      directory,
      "models/marts/fct_orders.sql",
      "select *, order_id from {{ ref('stg_orders') }}\n",
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    }).filter((diagnostic) => diagnostic.rule === "no-select-star");

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.filePath).toContain("models/marts/fct_orders.sql");
  });

  it("uses parser semantics for staging-no-join", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-sql-style-"));

    writeFile(
      directory,
      "dbt_project.yml",
      'name: sql_style_fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "models/staging/stg_orders.sql",
      "select o.id from raw_orders o join raw_customers c on o.customer_id = c.id\n",
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    }).filter((diagnostic) => diagnostic.rule === "staging-no-join");

    expect(diagnostics.length).toBeGreaterThan(0);
  });

  it("uses parser semantics for excessive-cte-depth", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-sql-style-"));

    writeFile(
      directory,
      "dbt_project.yml",
      'name: sql_style_fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "models/marts/fct_orders.sql",
      [
        "with",
        "a as (select 1),",
        "b as (select 1),",
        "c as (select 1),",
        "d as (select 1),",
        "e as (select 1),",
        "f as (select 1),",
        "g as (select 1),",
        "h as (select 1),",
        "i as (select 1)",
        "select * from a",
      ].join("\n"),
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    }).filter((diagnostic) => diagnostic.rule === "excessive-cte-depth");

    expect(diagnostics.length).toBeGreaterThan(0);
  });

  it("uses parser semantics for script-semicolon (missing terminator)", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-sql-style-"));

    writeFile(
      directory,
      "dbt_project.yml",
      'name: sql_style_fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(directory, "models/staging/stg_orders.sql", "select id from raw_orders\n");

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    }).filter((diagnostic) => diagnostic.rule === "script-semicolon");

    expect(diagnostics.length).toBeGreaterThan(0);
  });

  it("uses parser semantics for script-semicolon (has terminator)", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-sql-style-"));

    writeFile(
      directory,
      "dbt_project.yml",
      'name: sql_style_fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(directory, "models/staging/stg_orders.sql", "select id from raw_orders;\n");

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    }).filter((diagnostic) => diagnostic.rule === "script-semicolon");

    expect(diagnostics).toHaveLength(0);
  });

  it("flags single-line multi-target SELECT (layout.select_targets style)", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-sql-style-"));

    writeFile(
      directory,
      "dbt_project.yml",
      'name: sql_style_fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(directory, "models/staging/stg_orders.sql", "select id, order_id from raw_orders;\n");

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    }).filter((diagnostic) => diagnostic.rule === "sql-select-targets-layout");

    expect(diagnostics.length).toBeGreaterThan(0);
  });

  it("does not flag newline-formatted multi-target SELECT", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-sql-style-"));

    writeFile(
      directory,
      "dbt_project.yml",
      'name: sql_style_fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "models/staging/stg_orders.sql",
      "select\n  id,\n  order_id\nfrom raw_orders;\n",
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    }).filter((diagnostic) => diagnostic.rule === "sql-select-targets-layout");

    expect(diagnostics).toHaveLength(0);
  });

  it("flags trailing comma in SELECT list (convention.select_trailing_comma style)", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-sql-style-"));

    writeFile(
      directory,
      "dbt_project.yml",
      'name: sql_style_fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "models/staging/stg_orders.sql",
      "select\n  id,\n  order_id,\nfrom raw_orders;\n",
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    }).filter((diagnostic) => diagnostic.rule === "sql-select-trailing-comma");

    expect(diagnostics.length).toBeGreaterThan(0);
  });

  it("flags missing trailing newline at end of SQL file", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-sql-style-"));

    writeFile(
      directory,
      "dbt_project.yml",
      'name: sql_style_fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    fs.writeFileSync(path.join(directory, "models/staging/stg_orders.sql"), "select id from raw_orders");

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    }).filter((diagnostic) => diagnostic.rule === "sql-file-trailing-newline");

    expect(diagnostics.length).toBeGreaterThan(0);
  });

  it("flags SQL files that begin with leading whitespace", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-sql-style-"));

    writeFile(
      directory,
      "dbt_project.yml",
      'name: sql_style_fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(directory, "models/staging/stg_orders.sql", "  select id from raw_orders\n");

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    }).filter((diagnostic) => diagnostic.rule === "sql-no-leading-whitespace");

    expect(diagnostics.length).toBeGreaterThan(0);
  });

  it("flags mixed capitalization for boolean/null literals", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-sql-style-"));

    writeFile(
      directory,
      "dbt_project.yml",
      'name: sql_style_fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "models/staging/stg_orders.sql",
      "select TRUE as is_active, null as deleted_at from raw_orders;\n",
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
      ruleConfig: {
        "sql-boolean-null-case": {
          capitalisationPolicy: "upper",
        },
      },
    }).filter((diagnostic) => diagnostic.rule === "sql-boolean-null-case");

    expect(diagnostics.length).toBeGreaterThan(0);
    expect(diagnostics.some((diagnostic) => diagnostic.message.includes("null"))).toBe(true);
  });

  it("flags binary operators without spaces", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-sql-style-"));

    writeFile(
      directory,
      "dbt_project.yml",
      'name: sql_style_fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(directory, "models/staging/stg_orders.sql", "select a=1, b + 2 from raw_orders;\n");

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    }).filter((diagnostic) => diagnostic.rule === "sql-operator-spacing");

    expect(diagnostics.length).toBeGreaterThan(0);
  });

  it("flags unused CTE definitions", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-sql-style-"));

    writeFile(
      directory,
      "dbt_project.yml",
      'name: sql_style_fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "models/staging/stg_orders.sql",
      [
        "with used_cte as (select 1 as id),",
        "unused_cte as (select 2 as id)",
        "select id from used_cte;",
      ].join("\n"),
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    }).filter((diagnostic) => diagnostic.rule === "sql-unused-cte");

    expect(diagnostics.length).toBeGreaterThan(0);
    expect(diagnostics.some((diagnostic) => diagnostic.message.includes("unused_cte"))).toBe(true);
  });

  it("flags whitespace between function name and opening parenthesis", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-sql-style-"));

    writeFile(
      directory,
      "dbt_project.yml",
      'name: sql_style_fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(directory, "models/staging/stg_orders.sql", "select sum (amount) from raw_orders;\n");

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    }).filter((diagnostic) => diagnostic.rule === "sql-function-spacing");

    expect(diagnostics.length).toBeGreaterThan(0);
  });

  it("flags CTE definitions without spacing before opening parenthesis", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-sql-style-"));

    writeFile(
      directory,
      "dbt_project.yml",
      'name: sql_style_fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "models/staging/stg_orders.sql",
      "with base as(select 1 as id)\n\nselect id from base;\n",
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    }).filter((diagnostic) => diagnostic.rule === "sql-cte-bracket-position");

    expect(diagnostics.length).toBeGreaterThan(0);
  });

  it("flags missing blank line after CTE block", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-sql-style-"));

    writeFile(
      directory,
      "dbt_project.yml",
      'name: sql_style_fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "models/staging/stg_orders.sql",
      "with base as (select 1 as id)\nselect id from base;\n",
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    }).filter((diagnostic) => diagnostic.rule === "sql-cte-blank-line-after");

    expect(diagnostics.length).toBeGreaterThan(0);
  });

  it("flags DISTINCT with GROUP BY in the same SELECT", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-sql-style-"));

    writeFile(
      directory,
      "dbt_project.yml",
      'name: sql_style_fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(directory, "models/staging/stg_orders.sql", "select distinct customer_id from raw_orders group by customer_id;\n");

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    }).filter((diagnostic) => diagnostic.rule === "sql-ambiguous-distinct-group-by");

    expect(diagnostics.length).toBeGreaterThan(0);
  });

  it("flags searched CASE that can be converted to simple CASE", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-sql-style-"));

    writeFile(
      directory,
      "dbt_project.yml",
      'name: sql_style_fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "models/staging/stg_orders.sql",
      "select case when status = 'paid' then 1 when status = 'refunded' then 2 else 0 end as status_code from raw_orders;\n",
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    }).filter((diagnostic) => diagnostic.rule === "sql-simple-case-preferred");

    expect(diagnostics.length).toBeGreaterThan(0);
  });

  it("flags nested CASE expressions", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-sql-style-"));

    writeFile(
      directory,
      "dbt_project.yml",
      'name: sql_style_fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "models/staging/stg_orders.sql",
      "select case when status = 'paid' then case when amount > 100 then 'large' else 'small' end else 'other' end as bucket from raw_orders;\n",
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    }).filter((diagnostic) => diagnostic.rule === "sql-case-nesting");

    expect(diagnostics.length).toBeGreaterThan(0);
  });

  it("flags implicit JOIN type (ambiguous.join style)", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-sql-style-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: sql_style_fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "models/staging/stg_orders.sql",
      "select * from raw_orders o join raw_customers c on o.customer_id = c.id;\n",
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    }).filter((diagnostic) => diagnostic.rule === "sql-explicit-join-type");

    expect(diagnostics.length).toBeGreaterThan(0);
  });

  it("flags mixed implicit/explicit ORDER BY directions (ambiguous.order_by style)", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-sql-style-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: sql_style_fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "models/staging/stg_orders.sql",
      "select * from raw_orders order by id, created_at desc;\n",
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    }).filter((diagnostic) => diagnostic.rule === "sql-order-by-direction-consistency");

    expect(diagnostics.length).toBeGreaterThan(0);
  });

  it("flags UNION without explicit ALL/DISTINCT (ambiguous.union style)", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-sql-style-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: sql_style_fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "models/staging/stg_orders.sql",
      "select 1 as id union select 2 as id;\n",
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    }).filter((diagnostic) => diagnostic.rule === "sql-union-explicit-qualifier");

    expect(diagnostics.length).toBeGreaterThan(0);
  });

  it("does not flag explicit UNION ALL", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-sql-style-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: sql_style_fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "models/staging/stg_orders.sql",
      "select 1 as id union all select 2 as id;\n",
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    }).filter((diagnostic) => diagnostic.rule === "sql-union-explicit-qualifier");

    expect(diagnostics).toHaveLength(0);
  });

  it("flags implicit column alias without AS", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-sql-style-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: sql_style_fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(directory, "models/staging/stg_orders.sql", "select count(*) cnt from raw_orders;\n");

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    }).filter((diagnostic) => diagnostic.rule === "sql-explicit-column-alias");

    expect(diagnostics.length).toBeGreaterThan(0);
  });

  it("does not flag explicit column alias with AS", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-sql-style-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: sql_style_fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(directory, "models/staging/stg_orders.sql", "select count(*) as cnt from raw_orders;\n");

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    }).filter((diagnostic) => diagnostic.rule === "sql-explicit-column-alias");

    expect(diagnostics).toHaveLength(0);
  });

  it("flags implicit table alias without AS", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-sql-style-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: sql_style_fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(directory, "models/staging/stg_orders.sql", "select * from raw_orders o;\n");

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    }).filter((diagnostic) => diagnostic.rule === "sql-explicit-table-alias");

    expect(diagnostics.length).toBeGreaterThan(0);
  });

  it("does not flag explicit table alias with AS", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-sql-style-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: sql_style_fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(directory, "models/staging/stg_orders.sql", "select * from raw_orders as o;\n");

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    }).filter((diagnostic) => diagnostic.rule === "sql-explicit-table-alias");

    expect(diagnostics).toHaveLength(0);
  });

  it("flags inconsistent function-name capitalization", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-sql-style-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: sql_style_fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "models/staging/stg_orders.sql",
      "select count(*) as c1, SUM(amount) as c2 from raw_orders;\n",
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    }).filter((diagnostic) => diagnostic.rule === "sql-function-name-case");

    expect(diagnostics.length).toBeGreaterThan(0);
  });

  it("flags inconsistent unquoted identifier capitalization", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-sql-style-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: sql_style_fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "models/staging/stg_orders.sql",
      "select OrderID as order_id from raw_orders;\n",
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    }).filter((diagnostic) => diagnostic.rule === "sql-unquoted-identifiers-case");

    expect(diagnostics.length).toBeGreaterThan(0);
  });

  it("flags set operators not surrounded by newlines", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-sql-style-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: sql_style_fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(directory, "models/staging/stg_orders.sql", "select 1 as id union all select 2 as id;\n");

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    }).filter((diagnostic) => diagnostic.rule === "sql-set-operator-newline");

    expect(diagnostics.length).toBeGreaterThan(0);
  });

  it("flags unqualified references in joined queries", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-sql-style-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: sql_style_fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "models/staging/stg_orders.sql",
      "select id from raw_orders as o join raw_customers as c on o.customer_id = c.id;\n",
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    }).filter((diagnostic) => diagnostic.rule === "sql-references-qualified");

    expect(diagnostics.length).toBeGreaterThan(0);
  });

  it("flags mixed qualified/unqualified references in one SELECT", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-sql-style-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: sql_style_fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "models/staging/stg_orders.sql",
      "select o.id, customer_id from raw_orders as o;\n",
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    }).filter((diagnostic) => diagnostic.rule === "sql-reference-consistency");

    expect(diagnostics.length).toBeGreaterThan(0);
  });

  it("flags trailing whitespace", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-sql-style-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: sql_style_fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(directory, "models/staging/stg_orders.sql", "select id from raw_orders;   \n");

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    }).filter((diagnostic) => diagnostic.rule === "sql-trailing-whitespace");

    expect(diagnostics.length).toBeGreaterThan(0);
  });

  it("flags inconsistent indentation width", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-sql-style-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: sql_style_fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(directory, "models/staging/stg_orders.sql", "select\n   id\nfrom raw_orders;\n");

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
      ruleConfig: {
        "sql-indentation-consistency": {
          indentWidth: 2,
        },
      },
    }).filter((diagnostic) => diagnostic.rule === "sql-indentation-consistency");

    expect(diagnostics.length).toBeGreaterThan(0);
  });
});
