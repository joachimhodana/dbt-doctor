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

const runRules = (directory: string, ruleIds: string[]) => {
  const diagnostics = runCustomRules({
    rootDirectory: directory,
    project: discoverProject(directory),
    ignoredTags: new Set(),
  });
  return diagnostics.filter((diagnostic) => ruleIds.includes(diagnostic.rule));
};

describe("dbt jinja false positives", () => {
  let directory: string;

  afterEach(() => {
    if (directory) fs.rmSync(directory, { recursive: true, force: true });
  });

  it("does not flag model.name, source() commas, or config quotes", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-jinja-fp-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "models/staging/stg_sales.sql",
      [
        "with",
        "    {{ model.name }} as (",
        "        select {{ trim_all_columns(source('raw', 'sales')) }}",
        "        from {{ source('raw', 'sales') }}",
        "    ),",
        "    final as (",
        "        select sales.id",
        "        from {{ model.name }} sales",
        "    )",
        "select id from final",
      ].join("\n"),
    );

    expect(runRules(directory, ["sql-reference-object-in-from"])).toHaveLength(0);
    expect(runRules(directory, ["sql-no-comma-join"])).toHaveLength(0);
    expect(runRules(directory, ["sql-expression-alias-required"])).toHaveLength(0);
    expect(runRules(directory, ["sql-reference-unnecessary-quoted"])).toHaveLength(0);
  });

  it("does not flag boolean literals inside jinja config blocks", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-jinja-fp-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "models/marts/fct_orders.sql",
      [
        '{{ config(meta={ "active": true, "enabled": false }) }}',
        "select id from {{ ref('orders') }}",
      ].join("\n"),
    );

    expect(runRules(directory, ["sql-boolean-literal-style"])).toHaveLength(0);
    expect(runRules(directory, ["sql-quoted-literal-style"])).toHaveLength(0);
  });

  it("does not flag where in line comments", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-jinja-fp-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "models/staging/stg_orders.sql",
      ["select id", "from orders", "        -- where active"].join("\n"),
    );

    expect(runRules(directory, ["sql-clause-newline-consistency"])).toHaveLength(0);
  });

  it("does not flag join when ON starts on the next line", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-jinja-fp-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "models/marts/fct_orders.sql",
      [
        "select o.id, t.code",
        "from orders o",
        "left join types t",
        "on o.type_code = t.code",
      ].join("\n"),
    );

    expect(runRules(directory, ["sql-join-condition-required"])).toHaveLength(0);
  });

  it("does not flag union by name column-count mismatches", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-jinja-fp-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "models/intermediate/int_union.sql",
      [
        "select *, 'a' as src from {{ ref('left') }}",
        "union by name",
        "select *, 'b' as src, 1 as extra from {{ ref('right') }}",
      ].join("\n"),
    );

    expect(runRules(directory, ["sql-set-operator-column-count-match"])).toHaveLength(0);
  });

  it("accepts ref() to seeds in manifest-backed validation", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-jinja-fp-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\nseed-paths: ["seeds"]\n',
    );
    writeFile(
      directory,
      "target/manifest.json",
      JSON.stringify({
        nodes: {
          "seed.fixture.iso_country_codes": {
            unique_id: "seed.fixture.iso_country_codes",
            name: "iso_country_codes",
            resource_type: "seed",
            depends_on: { nodes: [] },
          },
          "model.fixture.iso_country_code_mapping": {
            unique_id: "model.fixture.iso_country_code_mapping",
            name: "iso_country_code_mapping",
            resource_type: "model",
            original_file_path: "models/staging/iso_country_code_mapping.sql",
            depends_on: { nodes: ["seed.fixture.iso_country_codes"] },
          },
        },
      }),
    );
    writeFile(
      directory,
      "models/staging/iso_country_code_mapping.sql",
      "select * from {{ ref('iso_country_codes') }}\n",
    );

    expect(runRules(directory, ["sql-reference-target-exists"])).toHaveLength(0);
    expect(runRules(directory, ["root-models"])).toHaveLength(0);
  });

  it("skips materialization hint when YAML declares materialized", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-jinja-fp-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "models/cleansing/_cleansing__models.yml",
      [
        "version: 2",
        "models:",
        "  - name: big_model",
        "    config:",
        "      materialized: incremental",
      ].join("\n"),
    );
    writeFile(
      directory,
      "models/cleansing/big_model.sql",
      `${"select 1\n".repeat(90)}`,
    );

    expect(runRules(directory, ["materialization-hint"])).toHaveLength(0);
  });
});
