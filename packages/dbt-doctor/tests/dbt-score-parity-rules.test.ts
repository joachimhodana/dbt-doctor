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

describe("dbt-score parity rules", () => {
  let directory: string;

  afterEach(() => {
    if (directory) fs.rmSync(directory, { recursive: true, force: true });
  });

  it("flags missing example sql, uniqueness test, and single pk definition", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-score-rules-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(directory, "models/marts/orders.sql", "select id from raw_orders\n");
    writeFile(
      directory,
      "models/marts/schema.yml",
      [
        "version: 2",
        "models:",
        "  - name: orders",
        "    description: orders",
        "    columns:",
        "      - name: id",
        "        description: id",
      ].join("\n"),
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    });

    expect(diagnostics.some((d) => d.rule === "model-has-example-sql")).toBe(true);
    expect(diagnostics.some((d) => d.rule === "model-has-uniqueness-test")).toBe(true);
    expect(diagnostics.some((d) => d.rule === "model-single-pk-column-level")).toBe(true);
  });

  it("flags missing seed column descriptions", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-score-rules-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: fixture\nversion: "1"\nprofile: default\nseed-paths: ["seeds"]\n',
    );
    writeFile(directory, "seeds/users.csv", "id,name\n1,a\n");
    writeFile(
      directory,
      "seeds/schema.yml",
      [
        "version: 2",
        "seeds:",
        "  - name: users",
        "    description: users seed",
        "    columns:",
        "      - name: id",
      ].join("\n"),
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    }).filter((d) => d.rule === "seed-columns-have-description");

    expect(diagnostics).toHaveLength(1);
  });
});
