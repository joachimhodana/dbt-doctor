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

  it("does not flag incremental filter subqueries inside jinja if blocks", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-jinja-fp-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "models/intermediate/int_affiliate_sales.sql",
      [
        "select *",
        "from {{ ref('affiliate_sales_unmapped') }}",
        "{% if is_incremental() %}",
        "where _fivetran_start >= (select max(_fivetran_start)::date from {{ this }})",
        "{% endif %}",
      ].join("\n"),
    );

    expect(runRules(directory, ["sql-expression-alias-required"])).toHaveLength(0);
  });

  it("does not flag snowflake star exclude projections", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-jinja-fp-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "models/intermediate/int_affiliate_sales.sql",
      [
        "with ranked as (select * exclude (rnk) from {{ ref('mapped') }})",
        "select * exclude (rnk, ppm_extract_id) from ranked",
      ].join("\n"),
    );

    expect(runRules(directory, ["sql-expression-alias-required"])).toHaveLength(0);
  });

  it("does not flag multiline join aliases or edp dim comment qualifiers", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-jinja-fp-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "models/marts/dim_customer.sql",
      [
        "{{ config(meta={",
        '    "compare_columns": [',
        '        "subsidiary_code",',
        '        "customer_name"',
        "    ]",
        "}) }}",
        "-- Columns from the cleansing model to be included in the target dimension model",
        "select",
        "    bill_to_id as affiliate_customer_id,",
        "    _early_sync_date, -- do not take dates in the future",
        "    false::boolean as _delete_ind",
        "from {{ ref('int_affiliate_customer') }}",
      ].join("\n"),
    );
    writeFile(
      directory,
      "models/cleansing/affiliate_sales_mapped.sql",
      [
        "with",
        "    {{ model.name }} as (",
        "        select {{ trim_all_columns(source('raw', 'sales')) }}",
        "        from {{ source('raw', 'sales') }}",
        "    ),",
        "    final as (",
        "        select coalesce(isbn.uk_isbn, sales.uk_isbn) as uk_isbn",
        "        from {{ model.name }} sales",
        "        left join (",
        "            select group_isbn, uk_isbn",
        "            from {{ source('raw', 'isbn') }}",
        "            where _fivetran_active",
        "        ) isbn",
        "            on sales.product_id = isbn.group_isbn",
        "    )",
        "select * from final",
      ].join("\n"),
    );
    writeFile(
      directory,
      "models/cleansing/affiliate_arch_sales_mapped.sql",
      [
        "with",
        "    {{ model.name }} as (",
        "        select {{ trim_all_columns(source('raw', 'arch_sales')) }}",
        "        from {{ source('raw', 'arch_sales') }}",
        "    ),",
        "    base as (",
        "        select id from {{ model.name }}",
        "    ),",
        "    final as (",
        "        select sales.id",
        "        from base sales",
        "        left join {{ ref('affiliate_import_audit') }} import",
        "            on sales.import_id = import.id",
        "    )",
        "select * from final",
      ].join("\n"),
    );
    writeFile(
      directory,
      "models/cleansing/affiliate_arch_sales_unmapped.sql",
      [
        "with final as (",
        "    select import.file_name",
        "    from {{ model.name }} sales",
        "    left join",
        '        {{ ref("affiliate_import_audit") }} import',
        "        on sales.import_id = import.id",
        ")",
        "select * from final",
      ].join("\n"),
    );
    writeFile(
      directory,
      "models/integration/dimensions/int_affiliate_sales_type_dim.sql",
      [
        "-- RELEVANT AND ALIAS THEM WITH THE TARGET DIM NAME E.G. INT_MEAS_UNIT AS UOM_CODE",
        "select ast.id from {{ ref('affiliate_sales_type') }} ast",
      ].join("\n"),
    );
    writeFile(
      directory,
      "models/integration/facts/int_affiliate_sales_fact.sql",
      [
        "with dedup as (",
        "    select {{ model.name }}.*, row_number() over (partition by id) as rn",
        "    from {{ model.name }}",
        ")",
        "select id from dedup",
      ].join("\n"),
    );
    writeFile(
      directory,
      "models/cleansing/subsidiary_mapping.sql",
      [
        "with {{ model.name }} as (",
        "    select {{ trim_all_columns(ref('subsidiary_map')) }}",
        "    from {{ ref('subsidiary_map') }}",
        "),",
        "final as (",
        "    select a.*,",
        "           load_datetime as _fivetran_synced",
        "    from {{ model.name }} a",
        ")",
        "select * from final",
      ].join("\n"),
    );
    writeFile(
      directory,
      "models/integration/dimensions/int_affiliate_subsidiary_dim.sql",
      [
        "-- IN THE SELECT STATEMENT INCLUDE ONLY COLUMNS FROM THE REFERENCED MODEL",
        "with data_union_mapping as (",
        "    select",
        "        sub_code as subsidiary_code,",
        "        subsidiary as subsidiary_name,",
        "        currency as subsidiary_currency_code,",
        "        1 as rnk",
        "    from {{ ref('affiliate_subsidiary') }}",
        "    union all",
        "    select",
        "        sub_code as subsidiary_code,",
        "        subsidiary as subsidiary_name,",
        "        currency as subsidiary_currency_code,",
        "        2 as rnk",
        "    from {{ ref('subsidiary_mapping') }}",
        ")",
        "select subsidiary_code from data_union_mapping",
      ].join("\n"),
    );

    expect(runRules(directory, ["sql-no-comma-join"])).toHaveLength(0);
    expect(runRules(directory, ["sql-reference-object-in-from"])).toHaveLength(0);
    expect(runRules(directory, ["sql-expression-alias-required"])).toHaveLength(0);
    expect(runRules(directory, ["sql-set-operator-column-count-match"])).toHaveLength(0);
  });
});
