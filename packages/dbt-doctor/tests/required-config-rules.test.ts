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

describe("required config rules", () => {
  let directory: string;

  afterEach(() => {
    if (directory) {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  });

  it("enforces +required_docs and +required_tests from dbt_project.yml", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-required-config-"));

    writeFile(
      directory,
      "dbt_project.yml",
      [
        "name: required_fixture",
        'version: "1"',
        "profile: default",
        'model-paths: ["models"]',
        "models:",
        "  required_fixture:",
        "    marts:",
        "      +required_docs: true",
        "      +required_tests:",
        "        not_null: 1",
        "        unique: 1",
      ].join("\n"),
    );

    writeFile(directory, "models/marts/fct_orders.sql", "select 1 as id\n");
    writeFile(
      directory,
      "models/marts/schema.yml",
      [
        "version: 2",
        "models:",
        "  - name: fct_orders",
        "    columns:",
        "      - name: id",
        "        tests:",
        "          - not_null",
      ].join("\n"),
    );

    const rules = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    }).map((diagnostic) => diagnostic.rule);

    expect(rules).toContain("required-docs-met");
    expect(rules).toContain("required-tests-met");
  });

  it("applies inherited policies and nested overrides", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-required-override-"));

    writeFile(
      directory,
      "dbt_project.yml",
      [
        "name: required_fixture",
        'version: "1"',
        "profile: default",
        'model-paths: ["models"]',
        "models:",
        "  required_fixture:",
        "    +required_docs: false",
        "    marts:",
        "      +required_tests: { not_null: 1 }",
        "      finance:",
        "        +required_docs: true",
        "        +required_tests: { unique: 2 }",
      ].join("\n"),
    );

    writeFile(directory, "models/marts/finance/fct_revenue.sql", "select 1 as id\n");
    writeFile(
      directory,
      "models/marts/finance/schema.yml",
      [
        "version: 2",
        "models:",
        "  - name: fct_revenue",
        "    columns:",
        "      - name: id",
        "        tests:",
        "          - not_null",
        "          - unique",
      ].join("\n"),
    );

    const rules = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    }).map((diagnostic) => diagnostic.rule);

    expect(rules).toContain("required-docs-met");
    expect(rules).toContain("required-tests-met");
  });

  it("does not report when required policies are satisfied", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-required-satisfied-"));

    writeFile(
      directory,
      "dbt_project.yml",
      [
        "name: required_fixture",
        'version: "1"',
        "profile: default",
        'model-paths: ["models"]',
        "models:",
        "  required_fixture:",
        "    marts:",
        "      +required_docs: true",
        "      +required_tests: { not_null: 1, unique: 1 }",
      ].join("\n"),
    );

    writeFile(directory, "models/marts/fct_orders.sql", "select 1 as id\n");
    writeFile(
      directory,
      "models/marts/schema.yml",
      [
        "version: 2",
        "models:",
        "  - name: fct_orders",
        "    description: Orders fact",
        "    columns:",
        "      - name: id",
        "        description: Primary key",
        "        tests:",
        "          - not_null",
        "          - unique",
      ].join("\n"),
    );

    const rules = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    }).map((diagnostic) => diagnostic.rule);

    expect(rules).not.toContain("required-docs-met");
    expect(rules).not.toContain("required-tests-met");
  });

  it("enforces seed +required_docs and +required_tests", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-required-seeds-"));

    writeFile(
      directory,
      "dbt_project.yml",
      [
        "name: required_fixture",
        'version: "1"',
        "profile: default",
        'model-paths: ["models"]',
        'seed-paths: ["seeds"]',
        "seeds:",
        "  required_fixture:",
        "    +required_docs: true",
        "    +required_tests: { not_null: 1 }",
      ].join("\n"),
    );

    writeFile(directory, "seeds/orders.csv", "id\n1\n");
    writeFile(
      directory,
      "seeds/schema.yml",
      ["version: 2", "seeds:", "  - name: orders", "    columns:", "      - name: id"].join("\n"),
    );

    const rules = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    }).map((diagnostic) => diagnostic.rule);

    expect(rules).toContain("required-docs-met");
    expect(rules).toContain("required-tests-met");
  });

  it("enforces source table +required_docs and +required_tests", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-required-sources-"));

    writeFile(
      directory,
      "dbt_project.yml",
      [
        "name: required_fixture",
        'version: "1"',
        "profile: default",
        'model-paths: ["models"]',
        "sources:",
        "  required_fixture:",
        "    +required_docs: true",
        "    +required_tests: { not_null: 1 }",
      ].join("\n"),
    );

    writeFile(
      directory,
      "models/_sources/raw.yml",
      ["version: 2", "sources:", "  - name: raw", "    tables:", "      - name: orders"].join("\n"),
    );

    const rules = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    }).map((diagnostic) => diagnostic.rule);

    expect(rules).toContain("required-docs-met");
    expect(rules).toContain("required-tests-met");
  });

  it("enforces +required_tags on models, seeds, and source tables", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-required-tags-"));

    writeFile(
      directory,
      "dbt_project.yml",
      [
        "name: required_fixture",
        'version: "1"',
        "profile: default",
        'model-paths: ["models"]',
        'seed-paths: ["seeds"]',
        "models:",
        "  required_fixture:",
        "    marts:",
        "      +required_tags: [daily, pii]",
        "seeds:",
        "  required_fixture:",
        "    +required_tags:",
        "      - governed",
        "sources:",
        "  required_fixture:",
        "    +required_tags: [bronze]",
      ].join("\n"),
    );

    writeFile(directory, "models/marts/fct_orders.sql", "select 1 as id\n");
    writeFile(
      directory,
      "models/marts/schema.yml",
      ["version: 2", "models:", "  - name: fct_orders", "    tags: [daily]"].join("\n"),
    );

    writeFile(directory, "seeds/orders.csv", "id\n1\n");
    writeFile(
      directory,
      "seeds/schema.yml",
      ["version: 2", "seeds:", "  - name: orders"].join("\n"),
    );

    writeFile(
      directory,
      "models/_sources/raw.yml",
      ["version: 2", "sources:", "  - name: raw", "    tables:", "      - name: orders"].join("\n"),
    );

    const rules = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    }).map((diagnostic) => diagnostic.rule);

    expect(rules).toContain("required-tags-met");
  });

  it("accepts package-style and inline test declarations for +required_tests", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-required-tests-shapes-"));

    writeFile(
      directory,
      "dbt_project.yml",
      [
        "name: required_fixture",
        'version: "1"',
        "profile: default",
        'model-paths: ["models"]',
        "models:",
        "  required_fixture:",
        "    marts:",
        "      +required_tests: { not_null: 1, unique: 2 }",
      ].join("\n"),
    );

    writeFile(directory, "models/marts/fct_orders.sql", "select 1 as id\n");
    writeFile(
      directory,
      "models/marts/schema.yml",
      [
        "version: 2",
        "models:",
        "  - name: fct_orders",
        "    columns:",
        "      - name: id",
        "        tests: [not_null, dbt_utils.unique]",
        "      - name: order_id",
        "        tests:",
        "          - dbt_utils.unique:",
      ].join("\n"),
    );

    const rules = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    }).map((diagnostic) => diagnostic.rule);

    expect(rules).not.toContain("required-tests-met");
  });
});
