import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { ALL_DBT_DOCTOR_RULE_KEYS, runCustomRules } from "dbt-doctor-rules";
import { discoverProject } from "@dbt-doctor/project-info";

const ENTERPRISE_RULE_IDS = [
  "column-description-required",
  "model-owner-or-meta",
  "exposure-documented",
  "source-pii-meta",
  "no-hardcoded-env",
  "incremental-unique-key",
  "snapshot-strategy",
  "relationship-test-on-fk",
  "not-null-on-required-keys",
  "model-has-tests",
  "dbt-expectations-hint",
  "non-canonical-layer-folder",
  "model-path-layer-mismatch",
  "cluster-by-hint",
  "excessive-cte-depth",
] as const;

const seedEnterpriseProject = (root: string): void => {
  const write = (rel: string, body: string) => {
    const file = path.join(root, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, body);
  };
  write(
    "dbt_project.yml",
    'name: enterprise_fixture\nversion: "1"\nprofile: bigquery_default\nmodel-paths: ["models"]\nsnapshot-paths: ["snapshots"]\n',
  );
  write("packages.yml", "packages:\n  - package: dbt-labs/dbt_utils\n");
  write(
    "models/_sources/raw.yml",
    "version: 2\nsources:\n  - name: raw\n    tables:\n      - name: users\n        columns:\n          - name: email\n",
  );
  write("models/exposures.yml", "version: 2\nexposures:\n  - name: dash\n    type: dashboard\n");
  write("models/custom_layer/x.sql", "select 1 as id\n");
  write("models/staging/fct_wrong_layer.sql", "select 1 as id\n");
  write("models/marts/fct_orders.sql", "select 1 as id, 2 as customer_id\n");
  write(
    "models/marts/schema.yml",
    "version: 2\nmodels:\n  - name: fct_orders\n    columns:\n      - name: id\n      - name: customer_id\n",
  );
  write("models/marts/inc.sql", "{{ config(materialized='incremental') }}\nselect 1 as order_id\n");
  write("models/marts/prod.sql", "select * from prod_analytics.orders\n");
  write(
    "models/marts/ctes.sql",
    `${Array.from({ length: 9 }, (_, i) => `with c${i} as (select 1) select 1`).join(";\n")};\n`,
  );
  write("models/marts/big.sql", `${"select 1 as n\n".repeat(85)}`);
  write(
    "snapshots/s.yml",
    "version: 2\nsnapshots:\n  - name: u\n    relation: ref('fct_orders')\n",
  );
};

describe("enterprise rules", () => {
  let dir: string;

  afterEach(() => {
    if (dir) fs.rmSync(dir, { recursive: true, force: true });
  });

  it("registers unique rule ids", () => {
    expect(new Set(ALL_DBT_DOCTOR_RULE_KEYS).size).toBe(ALL_DBT_DOCTOR_RULE_KEYS.length);
    for (const id of ENTERPRISE_RULE_IDS) {
      expect(ALL_DBT_DOCTOR_RULE_KEYS).toContain(id);
    }
  });

  it("fires on a synthetic project", () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-enterprise-"));
    seedEnterpriseProject(dir);
    const rules = runCustomRules({
      rootDirectory: dir,
      project: discoverProject(dir),
      ignoredTags: new Set(),
    }).map((d) => d.rule);
    const behavioralIds = ENTERPRISE_RULE_IDS.filter((id) => id !== "model-path-layer-mismatch");
    for (const id of behavioralIds) {
      expect(rules, id).toContain(id);
    }
  });
});
