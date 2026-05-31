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

describe("dbt-checkpoint parity rules", () => {
  let directory: string;

  afterEach(() => {
    if (directory) fs.rmSync(directory, { recursive: true, force: true });
  });

  it("enforces model-columns-have-meta-keys when configured", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-checkpoint-rules-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(directory, "models/marts/orders.sql", "select 1 as id\n");
    writeFile(
      directory,
      "models/marts/schema.yml",
      [
        "version: 2",
        "models:",
        "  - name: orders",
        "    columns:",
        "      - name: id",
        "        meta:",
        "          owner: analytics",
        "      - name: email",
      ].join("\n"),
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
      ruleConfig: {
        "model-columns-have-meta-keys": {
          required: ["owner"],
        },
      },
    }).filter((diagnostic) => diagnostic.rule === "model-columns-have-meta-keys");

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.message).toContain('Column "email"');
  });

  it("enforces model-parents-and-childs thresholds via manifest", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-checkpoint-rules-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "target/manifest.json",
      JSON.stringify({
        nodes: {
          "model.proj.orders": {
            unique_id: "model.proj.orders",
            name: "orders",
            resource_type: "model",
            original_file_path: "models/marts/orders.sql",
            depends_on: { nodes: ["model.proj.stg_orders", "model.proj.dim_users"] },
          },
          "model.proj.stg_orders": {
            unique_id: "model.proj.stg_orders",
            name: "stg_orders",
            resource_type: "model",
            original_file_path: "models/staging/stg_orders.sql",
            depends_on: { nodes: [] },
          },
          "model.proj.dim_users": {
            unique_id: "model.proj.dim_users",
            name: "dim_users",
            resource_type: "model",
            original_file_path: "models/marts/dim_users.sql",
            depends_on: { nodes: [] },
          },
          "model.proj.fct_sales": {
            unique_id: "model.proj.fct_sales",
            name: "fct_sales",
            resource_type: "model",
            original_file_path: "models/marts/fct_sales.sql",
            depends_on: { nodes: ["model.proj.orders"] },
          },
        },
      }),
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
      ruleConfig: {
        "model-parents-and-childs": {
          maxParents: 1,
        },
      },
    }).filter((diagnostic) => diagnostic.rule === "model-parents-and-childs");

    expect(diagnostics.length).toBeGreaterThan(0);
    expect(diagnostics[0]?.message).toContain('Model "orders" has 2 model parents');
  });

  it("flags trailing EOF semicolon in model SQL", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-checkpoint-rules-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(directory, "models/staging/stg_orders.sql", "select id from raw_orders;\n");

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    }).filter((diagnostic) => diagnostic.rule === "script-semicolon");

    expect(diagnostics).toHaveLength(1);
  });

  it("flags hardcoded relation usage without ref/source", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-checkpoint-rules-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(directory, "models/staging/stg_orders.sql", "select * from analytics.raw_orders\n");

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    });

    expect(diagnostics.some((diagnostic) => diagnostic.rule === "script-ref-and-source")).toBe(
      true,
    );
    expect(diagnostics.some((diagnostic) => diagnostic.rule === "script-has-no-table-name")).toBe(
      true,
    );
  });

  it("flags invalid ref/source targets and unknown macro calls", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-checkpoint-rules-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\nmacro-paths: ["macros"]\n',
    );
    writeFile(
      directory,
      "target/manifest.json",
      JSON.stringify({
        nodes: {
          "model.proj.orders": {
            unique_id: "model.proj.orders",
            name: "orders",
            resource_type: "model",
            original_file_path: "models/orders.sql",
            depends_on: { nodes: [] },
          },
          "source.proj.raw.orders": {
            unique_id: "source.proj.raw.orders",
            name: "orders",
            source_name: "raw",
            resource_type: "source",
            original_file_path: "models/sources.yml",
            depends_on: { nodes: [] },
          },
        },
      }),
    );
    writeFile(directory, "macros/macros.sql", "{% macro normalize_name(v) %}{{ v }}{% endmacro %}");
    writeFile(
      directory,
      "models/orders.sql",
      [
        "select {{ ref('missing_model') }} as a, {{ source('raw', 'missing_table') }} as b",
        "from analytics.raw_orders",
        "where {{ unknown_macro('x') }} = 1",
      ].join("\n"),
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    }).filter((diagnostic) => diagnostic.rule === "script-ref-and-source");

    expect(diagnostics.length).toBeGreaterThanOrEqual(3);
  });

  it("checks source, table, and column descriptions", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-checkpoint-rules-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "models/sources.yml",
      [
        "version: 2",
        "sources:",
        "  - name: stripe",
        "    tables:",
        "      - name: payments",
        "        columns:",
        "          - name: id",
      ].join("\n"),
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    });

    expect(diagnostics.some((diagnostic) => diagnostic.rule === "source-has-description")).toBe(
      true,
    );
    expect(
      diagnostics.some((diagnostic) => diagnostic.rule === "source-table-has-description"),
    ).toBe(true);
    expect(diagnostics.some((diagnostic) => diagnostic.rule === "source-columns-have-desc")).toBe(
      true,
    );
  });

  it("checks source-has-all-columns when catalog is present", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-checkpoint-rules-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "models/sources.yml",
      [
        "version: 2",
        "sources:",
        "  - name: stripe",
        "    description: stripe source",
        "    tables:",
        "      - name: payments",
        "        description: payment rows",
        "        columns:",
        "          - name: id",
        "            description: payment id",
      ].join("\n"),
    );
    writeFile(
      directory,
      "target/catalog.json",
      JSON.stringify({
        sources: {
          "source.proj.stripe.payments": {
            source_name: "stripe",
            name: "payments",
            columns: {
              id: { name: "id" },
              status: { name: "status" },
            },
          },
        },
      }),
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    }).filter((diagnostic) => diagnostic.rule === "source-has-all-columns");

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.message).toContain("status");
  });

  it("enforces source test hooks when configured", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-checkpoint-rules-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "models/sources.yml",
      [
        "version: 2",
        "sources:",
        "  - name: stripe",
        "    tables:",
        "      - name: payments",
        "        tests:",
        "          - not_null",
      ].join("\n"),
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
      ruleConfig: {
        "source-has-tests-by-name": { unique: 1 },
        "source-has-tests-by-type": { data: 1 },
        "source-has-tests-by-group": { uniqueness: 1 },
      },
    });

    expect(diagnostics.some((diagnostic) => diagnostic.rule === "source-has-tests-by-name")).toBe(
      true,
    );
    expect(diagnostics.some((diagnostic) => diagnostic.rule === "source-has-tests-by-type")).toBe(
      true,
    );
    expect(diagnostics.some((diagnostic) => diagnostic.rule === "source-has-tests-by-group")).toBe(
      true,
    );
  });

  it("enforces macro-has-meta-keys when configured", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-checkpoint-rules-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: fixture\nversion: "1"\nprofile: default\nmacro-paths: ["macros"]\n',
    );
    writeFile(
      directory,
      "macros/schema.yml",
      [
        "version: 2",
        "macros:",
        "  - name: normalize_email",
        "    meta:",
        "      owner: data-platform",
      ].join("\n"),
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
      ruleConfig: {
        "macro-has-meta-keys": {
          required: ["owner", "team"],
        },
      },
    }).filter((diagnostic) => diagnostic.rule === "macro-has-meta-keys");

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.message).toContain("team");
  });
});
