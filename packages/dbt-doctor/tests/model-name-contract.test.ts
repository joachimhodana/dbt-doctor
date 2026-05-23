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

describe("model-name-contract", () => {
  let directory: string;

  afterEach(() => {
    if (directory) fs.rmSync(directory, { recursive: true, force: true });
  });

  it("is inert when no pattern is configured", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-model-name-contract-"));

    writeFile(
      directory,
      "dbt_project.yml",
      'name: naming_fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(directory, "models/marts/orders.sql", "select 1 as id\n");

    const rules = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    }).map((diagnostic) => diagnostic.rule);

    expect(rules).not.toContain("model-name-contract");
  });

  it("reports models that violate the configured naming regex", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-model-name-contract-"));

    writeFile(
      directory,
      "dbt_project.yml",
      'name: naming_fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(directory, "models/staging/stg_orders.sql", "select 1 as id\n");
    writeFile(directory, "models/marts/orders.sql", "select 1 as id\n");

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
      ruleConfig: {
        "model-name-contract": {
          pattern: "^(stg|int|fct|dim)_[a-z0-9_]+$",
        },
      },
    });

    const flaggedFiles = diagnostics
      .filter((diagnostic) => diagnostic.rule === "model-name-contract")
      .map((diagnostic) => diagnostic.filePath);

    expect(flaggedFiles).toContain("models/marts/orders.sql");
    expect(flaggedFiles).not.toContain("models/staging/stg_orders.sql");
  });
});
