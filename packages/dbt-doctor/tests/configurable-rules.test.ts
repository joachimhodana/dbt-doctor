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

describe("phase3 configurable rules", () => {
  let directory: string;

  afterEach(() => {
    if (directory) fs.rmSync(directory, { recursive: true, force: true });
  });

  it("enforces model-tags allowed list when configured", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-configurable-rules-"));

    writeFile(
      directory,
      "dbt_project.yml",
      'name: configurable_fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(directory, "models/marts/orders.sql", "select 1 as id\n");
    writeFile(directory, "models/marts/stg_users.sql", "select 1 as id\n");
    writeFile(
      directory,
      "models/marts/schema.yml",
      [
        "version: 2",
        "models:",
        "  - name: orders",
        "    tags: [legacy]",
        "  - name: stg_users",
        "    tags: [daily]",
      ].join("\n"),
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
      ruleConfig: {
        "model-tags": {
          allowed: ["daily", "hourly"],
        },
      },
    });

    const tagged = diagnostics
      .filter((diagnostic) => diagnostic.rule === "model-tags")
      .map((diagnostic) => diagnostic.message);

    expect(tagged.some((message) => message.includes('Model "orders"'))).toBe(true);
    expect(tagged.some((message) => message.includes('Model "stg_users"'))).toBe(false);
  });

  it("enforces required model meta keys when configured", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-configurable-rules-"));

    writeFile(
      directory,
      "dbt_project.yml",
      'name: configurable_fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(directory, "models/marts/orders.sql", "select 1 as id\n");
    writeFile(directory, "models/marts/users.sql", "select 1 as id\n");
    writeFile(
      directory,
      "models/marts/schema.yml",
      [
        "version: 2",
        "models:",
        "  - name: orders",
        "    meta:",
        "      owner: analytics",
        "  - name: users",
        "    meta:",
        "      owner: analytics",
        "      team: growth",
      ].join("\n"),
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
      ruleConfig: {
        "model-has-meta-keys": {
          required: ["owner", "team"],
        },
      },
    });

    const meta = diagnostics
      .filter((diagnostic) => diagnostic.rule === "model-has-meta-keys")
      .map((diagnostic) => diagnostic.message);

    expect(meta.some((message) => message.includes('Model "orders"'))).toBe(true);
    expect(meta.some((message) => message.includes('Model "users"'))).toBe(false);
  });

  it("enforces model-has-tests-by-name minimums when configured", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-configurable-rules-"));

    writeFile(
      directory,
      "dbt_project.yml",
      'name: configurable_fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(directory, "models/marts/orders.sql", "select 1 as id\n");
    writeFile(directory, "models/marts/users.sql", "select 1 as id\n");
    writeFile(
      directory,
      "models/marts/schema.yml",
      [
        "version: 2",
        "models:",
        "  - name: orders",
        "    columns:",
        "      - name: id",
        "        tests: [not_null]",
        "  - name: users",
        "    columns:",
        "      - name: id",
        "        tests: [not_null, unique]",
      ].join("\n"),
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
      ruleConfig: {
        "model-has-tests-by-name": {
          not_null: 1,
          unique: 1,
        },
      },
    });

    const byName = diagnostics
      .filter((diagnostic) => diagnostic.rule === "model-has-tests-by-name")
      .map((diagnostic) => diagnostic.message);

    expect(byName.some((message) => message.includes('Model "orders"'))).toBe(true);
    expect(byName.some((message) => message.includes('Model "users"'))).toBe(false);
  });

  it("enforces model-has-tests-by-type minimums when configured", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-configurable-rules-"));

    writeFile(
      directory,
      "dbt_project.yml",
      'name: configurable_fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\ntest-paths: ["tests"]\n',
    );
    writeFile(directory, "models/marts/orders.sql", "select 1 as id\n");
    writeFile(directory, "models/marts/users.sql", "select 1 as id\n");
    writeFile(
      directory,
      "models/marts/schema.yml",
      [
        "version: 2",
        "models:",
        "  - name: orders",
        "    columns:",
        "      - name: id",
        "        tests: [not_null]",
        "  - name: users",
        "    columns:",
        "      - name: id",
        "        tests: [not_null, unique]",
      ].join("\n"),
    );
    writeFile(
      directory,
      "tests/orders_singular.sql",
      "select 1 where exists (select * from {{ ref('orders') }})",
    );
    writeFile(
      directory,
      "tests/users_singular.sql",
      "select 1 where exists (select * from {{ ref('users') }})",
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
      ruleConfig: {
        "model-has-tests-by-type": {
          schema: 2,
          data: 1,
        },
      },
    });

    const byType = diagnostics
      .filter((diagnostic) => diagnostic.rule === "model-has-tests-by-type")
      .map((diagnostic) => diagnostic.message);

    expect(byType.some((message) => message.includes('Model "orders"'))).toBe(true);
    expect(byType.some((message) => message.includes('Model "users"'))).toBe(false);
  });

  it("enforces model-has-tests-by-group minimums when configured", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-configurable-rules-"));

    writeFile(
      directory,
      "dbt_project.yml",
      'name: configurable_fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(directory, "models/marts/orders.sql", "select 1 as id\n");
    writeFile(directory, "models/marts/users.sql", "select 1 as id\n");
    writeFile(
      directory,
      "models/marts/schema.yml",
      [
        "version: 2",
        "models:",
        "  - name: orders",
        "    columns:",
        "      - name: id",
        "        tests: [not_null]",
        "  - name: users",
        "    columns:",
        "      - name: id",
        "        tests: [not_null, unique]",
      ].join("\n"),
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
      ruleConfig: {
        "model-has-tests-by-group": {
          uniqueness: 1,
          nullness: 1,
        },
      },
    });

    const byGroup = diagnostics
      .filter((diagnostic) => diagnostic.rule === "model-has-tests-by-group")
      .map((diagnostic) => diagnostic.message);

    expect(byGroup.some((message) => message.includes('Model "orders"'))).toBe(true);
    expect(byGroup.some((message) => message.includes('Model "users"'))).toBe(false);
  });

  it("enforces configurable source/seed/snapshot/exposure meta and tags rules", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-configurable-rules-"));

    writeFile(
      directory,
      "dbt_project.yml",
      [
        "name: configurable_fixture",
        'version: "1"',
        "profile: default",
        'model-paths: ["models"]',
        'seed-paths: ["seeds"]',
        'snapshot-paths: ["snapshots"]',
      ].join("\n"),
    );
    writeFile(
      directory,
      "models/_sources/raw.yml",
      [
        "version: 2",
        "sources:",
        "  - name: raw",
        "    tables:",
        "      - name: orders",
        "        tags: [legacy]",
      ].join("\n"),
    );
    writeFile(
      directory,
      "seeds/seeds.yml",
      ["version: 2", "seeds:", "  - name: users", "    meta:", "      owner: analytics"].join("\n"),
    );
    writeFile(
      directory,
      "snapshots/snapshots.yml",
      [
        "version: 2",
        "snapshots:",
        "  - name: users_snapshot",
        "    meta:",
        "      owner: analytics",
      ].join("\n"),
    );
    writeFile(
      directory,
      "models/exposures.yml",
      [
        "version: 2",
        "exposures:",
        "  - name: dashboard",
        "    meta:",
        "      owner: analytics",
      ].join("\n"),
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
      ruleConfig: {
        "source-tags": { allowed: ["daily"] },
        "source-has-meta-keys": { required: ["owner"] },
        "seed-has-meta-keys": { required: ["owner", "team"] },
        "snapshot-has-meta-keys": { required: ["owner", "team"] },
        "exposure-has-meta-keys": { required: ["owner", "team"] },
      },
    });

    const rules = diagnostics.map((diagnostic) => diagnostic.rule);
    expect(rules).toContain("source-tags");
    expect(rules).toContain("source-has-meta-keys");
    expect(rules).toContain("seed-has-meta-keys");
    expect(rules).toContain("snapshot-has-meta-keys");
    expect(rules).toContain("exposure-has-meta-keys");
  });

  it("enforces source loader/labels, test meta/tags, script semicolon, and column contract", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-configurable-rules-"));

    writeFile(
      directory,
      "dbt_project.yml",
      [
        "name: configurable_fixture",
        'version: "1"',
        "profile: default",
        'model-paths: ["models"]',
        'test-paths: ["tests"]',
      ].join("\n"),
    );
    writeFile(directory, "models/marts/orders.sql", "select 1 as amount\n");
    writeFile(directory, "models/marts/users.sql", "select 1 as total_amount;\n");
    writeFile(
      directory,
      "models/marts/schema.yml",
      [
        "version: 2",
        "models:",
        "  - name: orders",
        "    columns:",
        "      - name: amount",
        "  - name: users",
        "    columns:",
        "      - name: total_amount",
      ].join("\n"),
    );
    writeFile(
      directory,
      "models/_sources/raw.yml",
      [
        "version: 2",
        "sources:",
        "  - name: raw",
        "    labels:",
        "      domain: finance",
        "    tables:",
        "      - name: orders",
      ].join("\n"),
    );
    writeFile(directory, "tests/orders_check.sql", "select * from {{ ref('orders') }}");
    writeFile(
      directory,
      "tests/users_check.sql",
      "{{ config(meta={'owner': 'analytics'}, tags=['daily']) }}\nselect * from {{ ref('users') }}",
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
      ruleConfig: {
        "source-has-loader": { enabled: true },
        "source-has-labels-keys": { required: ["domain", "team"] },
        "test-has-meta-keys": { required: ["owner"] },
        "test-tags": { allowed: ["daily"] },
        "column-name-contract": { "pattern.amount": "^.*_amount$" },
      },
    });

    const rules = diagnostics.map((diagnostic) => diagnostic.rule);
    expect(rules).toContain("source-has-loader");
    expect(rules).toContain("source-has-labels-keys");
    expect(rules).toContain("test-has-meta-keys");
    expect(rules).toContain("test-tags");
    expect(rules).toContain("script-semicolon");
    expect(rules).toContain("column-name-contract");
  });
});
