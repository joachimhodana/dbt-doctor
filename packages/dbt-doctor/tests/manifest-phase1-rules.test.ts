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

describe("manifest phase1 rules", () => {
  let directory: string;

  afterEach(() => {
    if (directory) fs.rmSync(directory, { recursive: true, force: true });
  });

  it("triggers remaining phase 1 DAG/manifest rules", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-phase1-"));

    writeFile(
      directory,
      "dbt_project.yml",
      'name: phase1_fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );

    // SQL models used by file-backed heuristics.
    writeFile(directory, "models/staging/stg_a.sql", "select 1 as id\n");
    writeFile(directory, "models/staging/stg_b.sql", "select 1 as id\n");
    writeFile(
      directory,
      "models/intermediate/int_sales.sql",
      "select * from {{ source('raw', 'orders') }} join {{ source('raw','customers') }} using(id)\n",
    );
    writeFile(directory, "models/intermediate/int_orders.sql", "select 1 as id\n");
    writeFile(directory, "models/intermediate/int_customers.sql", "select 1 as id\n");
    writeFile(directory, "models/marts/fct_rejoin.sql", "select 1 as id\n");
    writeFile(directory, "models/marts/fct_hub.sql", "select 1 as id\n");
    writeFile(directory, "models/marts/fct_big_join.sql", "select 1 as id\n");
    writeFile(directory, "models/marts/fct_isolated.sql", "select 1 as id\n");
    writeFile(directory, "models/marts/fct_private_view.sql", "select 1 as id\n");
    writeFile(directory, "models/marts/v1.sql", "select 1 as id\n");
    writeFile(directory, "models/marts/v2.sql", "select 1 as id\n");
    writeFile(directory, "models/marts/v3.sql", "select 1 as id\n");
    writeFile(directory, "models/marts/v4.sql", "select 1 as id\n");
    writeFile(directory, "models/marts/v5.sql", "select 1 as id\n");
    for (let index = 1; index <= 9; index += 1) {
      writeFile(directory, `models/marts/fct_child_${index}.sql`, "select 1 as id\n");
    }

    const manifest = {
      nodes: {
        "model.phase1_fixture.stg_a": {
          unique_id: "model.phase1_fixture.stg_a",
          name: "stg_a",
          resource_type: "model",
          original_file_path: "models/staging/stg_a.sql",
          depends_on: { nodes: ["model.phase1_fixture.stg_b", "model.phase1_fixture.int_sales"] },
        },
        "model.phase1_fixture.stg_b": {
          unique_id: "model.phase1_fixture.stg_b",
          name: "stg_b",
          resource_type: "model",
          original_file_path: "models/staging/stg_b.sql",
          depends_on: { nodes: ["source.phase1_fixture.raw.orders"] },
        },
        "model.phase1_fixture.int_sales": {
          unique_id: "model.phase1_fixture.int_sales",
          name: "int_sales",
          resource_type: "model",
          original_file_path: "models/intermediate/int_sales.sql",
          depends_on: {
            nodes: [
              "source.phase1_fixture.raw.orders",
              "source.phase1_fixture.raw.customers",
            ],
          },
        },
        "model.phase1_fixture.int_orders": {
          unique_id: "model.phase1_fixture.int_orders",
          name: "int_orders",
          resource_type: "model",
          original_file_path: "models/intermediate/int_orders.sql",
          depends_on: { nodes: ["source.phase1_fixture.raw.orders"] },
        },
        "model.phase1_fixture.int_customers": {
          unique_id: "model.phase1_fixture.int_customers",
          name: "int_customers",
          resource_type: "model",
          original_file_path: "models/intermediate/int_customers.sql",
          depends_on: { nodes: ["source.phase1_fixture.raw.orders"] },
        },
        "model.phase1_fixture.fct_rejoin": {
          unique_id: "model.phase1_fixture.fct_rejoin",
          name: "fct_rejoin",
          resource_type: "model",
          original_file_path: "models/marts/fct_rejoin.sql",
          depends_on: {
            nodes: ["model.phase1_fixture.int_orders", "model.phase1_fixture.int_customers"],
          },
        },
        "model.phase1_fixture.fct_hub": {
          unique_id: "model.phase1_fixture.fct_hub",
          name: "fct_hub",
          resource_type: "model",
          original_file_path: "models/marts/fct_hub.sql",
          depends_on: { nodes: ["source.phase1_fixture.raw.orders"] },
        },
        "model.phase1_fixture.fct_big_join": {
          unique_id: "model.phase1_fixture.fct_big_join",
          name: "fct_big_join",
          resource_type: "model",
          original_file_path: "models/marts/fct_big_join.sql",
          depends_on: {
            nodes: [
              "source.phase1_fixture.raw.orders",
              "source.phase1_fixture.raw.customers",
              "source.phase1_fixture.raw.extra1",
              "source.phase1_fixture.raw.extra2",
              "source.phase1_fixture.raw.extra3",
              "source.phase1_fixture.raw.extra4",
              "source.phase1_fixture.raw.extra5",
              "source.phase1_fixture.raw.extra6",
              "source.phase1_fixture.raw.extra7",
            ],
          },
        },
        "model.phase1_fixture.fct_isolated": {
          unique_id: "model.phase1_fixture.fct_isolated",
          name: "fct_isolated",
          resource_type: "model",
          original_file_path: "models/marts/fct_isolated.sql",
          depends_on: { nodes: [] },
        },
        "model.phase1_fixture.fct_private_view": {
          unique_id: "model.phase1_fixture.fct_private_view",
          name: "fct_private_view",
          resource_type: "model",
          original_file_path: "models/marts/fct_private_view.sql",
          access: "private",
          config: { materialized: "view" },
          depends_on: { nodes: ["source.phase1_fixture.raw.orders"] },
        },
        "model.phase1_fixture.v1": {
          unique_id: "model.phase1_fixture.v1",
          name: "v1",
          resource_type: "model",
          original_file_path: "models/marts/v1.sql",
          config: { materialized: "view" },
          depends_on: { nodes: ["source.phase1_fixture.raw.orders"] },
        },
        "model.phase1_fixture.v2": {
          unique_id: "model.phase1_fixture.v2",
          name: "v2",
          resource_type: "model",
          original_file_path: "models/marts/v2.sql",
          config: { materialized: "view" },
          depends_on: { nodes: ["model.phase1_fixture.v1"] },
        },
        "model.phase1_fixture.v3": {
          unique_id: "model.phase1_fixture.v3",
          name: "v3",
          resource_type: "model",
          original_file_path: "models/marts/v3.sql",
          config: { materialized: "view" },
          depends_on: { nodes: ["model.phase1_fixture.v2"] },
        },
        "model.phase1_fixture.v4": {
          unique_id: "model.phase1_fixture.v4",
          name: "v4",
          resource_type: "model",
          original_file_path: "models/marts/v4.sql",
          config: { materialized: "view" },
          depends_on: { nodes: ["model.phase1_fixture.v3"] },
        },
        "model.phase1_fixture.v5": {
          unique_id: "model.phase1_fixture.v5",
          name: "v5",
          resource_type: "model",
          original_file_path: "models/marts/v5.sql",
          config: { materialized: "view" },
          depends_on: { nodes: ["model.phase1_fixture.v4"] },
        },
        ...Object.fromEntries(
          Array.from({ length: 9 }, (_, idx) => {
            const id = idx + 1;
            return [
              `model.phase1_fixture.fct_child_${id}`,
              {
                unique_id: `model.phase1_fixture.fct_child_${id}`,
                name: `fct_child_${id}`,
                resource_type: "model",
                original_file_path: `models/marts/fct_child_${id}.sql`,
                depends_on: { nodes: ["model.phase1_fixture.fct_hub"] },
              },
            ];
          }),
        ),
      },
      sources: {
        "source.phase1_fixture.raw.orders": {
          unique_id: "source.phase1_fixture.raw.orders",
          name: "orders",
          resource_type: "source",
          original_file_path: "models/_sources/raw.yml",
          depends_on: { nodes: [] },
        },
        "source.phase1_fixture.raw.customers": {
          unique_id: "source.phase1_fixture.raw.customers",
          name: "customers",
          resource_type: "source",
          description: "Customers source",
          original_file_path: "models/_sources/raw.yml",
          depends_on: { nodes: [] },
        },
        "source.phase1_fixture.raw.extra1": { unique_id: "source.phase1_fixture.raw.extra1", name: "extra1", resource_type: "source", original_file_path: "models/_sources/raw.yml", depends_on: { nodes: [] } },
        "source.phase1_fixture.raw.extra2": { unique_id: "source.phase1_fixture.raw.extra2", name: "extra2", resource_type: "source", original_file_path: "models/_sources/raw.yml", depends_on: { nodes: [] } },
        "source.phase1_fixture.raw.extra3": { unique_id: "source.phase1_fixture.raw.extra3", name: "extra3", resource_type: "source", original_file_path: "models/_sources/raw.yml", depends_on: { nodes: [] } },
        "source.phase1_fixture.raw.extra4": { unique_id: "source.phase1_fixture.raw.extra4", name: "extra4", resource_type: "source", original_file_path: "models/_sources/raw.yml", depends_on: { nodes: [] } },
        "source.phase1_fixture.raw.extra5": { unique_id: "source.phase1_fixture.raw.extra5", name: "extra5", resource_type: "source", original_file_path: "models/_sources/raw.yml", depends_on: { nodes: [] } },
        "source.phase1_fixture.raw.extra6": { unique_id: "source.phase1_fixture.raw.extra6", name: "extra6", resource_type: "source", original_file_path: "models/_sources/raw.yml", depends_on: { nodes: [] } },
        "source.phase1_fixture.raw.extra7": { unique_id: "source.phase1_fixture.raw.extra7", name: "extra7", resource_type: "source", original_file_path: "models/_sources/raw.yml", depends_on: { nodes: [] } },
        // duplicate logical source (different package)
        "source.other_pkg.raw.orders": {
          unique_id: "source.other_pkg.raw.orders",
          name: "orders",
          resource_type: "source",
          original_file_path: "models/_sources/raw.yml",
          depends_on: { nodes: [] },
        },
      },
      exposures: {
        "exposure.phase1_fixture.analytics_dashboard": {
          unique_id: "exposure.phase1_fixture.analytics_dashboard",
          name: "analytics_dashboard",
          resource_type: "exposure",
          original_file_path: "models/exposures.yml",
          depends_on: { nodes: ["model.phase1_fixture.fct_private_view"] },
        },
      },
    };

    writeFile(directory, "target/manifest.json", JSON.stringify(manifest));

    const rules = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    }).map((diagnostic) => diagnostic.rule);

    for (const expected of [
      "staging-depends-on-downstream",
      "source-fanout",
      "model-fanout",
      "too-many-joins",
      "rejoining-upstream-concepts",
      "chained-views",
      "duplicate-sources",
      "undocumented-sources",
      "exposure-parents-materializations",
      "exposures-on-private-models",
      "root-models",
      "multiple-sources-joined",
    ]) {
      expect(rules).toContain(expected);
    }
  });
});
