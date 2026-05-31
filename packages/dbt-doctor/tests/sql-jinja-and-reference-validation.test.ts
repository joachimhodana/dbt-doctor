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

describe("sqlfluff parity next", () => {
  let directory: string;

  afterEach(() => {
    if (directory) fs.rmSync(directory, { recursive: true, force: true });
  });

  it("flags invalid/unclosed jinja tags", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-sqlfluff-next-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "models/staging/stg_orders.sql",
      "select {{ ref('orders') from raw_orders\n",
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    }).filter((diagnostic) => diagnostic.rule === "jinja-syntax-valid");

    expect(diagnostics.length).toBeGreaterThan(0);
  });

  it("flags missing ref()/source() targets using manifest", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-sqlfluff-next-"));
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
            depends_on: { nodes: [] },
          },
        },
        sources: {
          "source.proj.raw.orders": {
            unique_id: "source.proj.raw.orders",
            name: "orders",
            resource_type: "source",
            original_file_path: "models/sources.yml",
            depends_on: { nodes: [] },
          },
        },
      }),
    );
    writeFile(
      directory,
      "models/staging/stg_orders.sql",
      [
        "select *",
        "from {{ ref('missing_model') }}",
        "join {{ source('raw', 'missing_table') }} using (id)",
      ].join("\n"),
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    }).filter((diagnostic) => diagnostic.rule === "sql-reference-target-exists");

    expect(
      diagnostics.some((diagnostic) => diagnostic.message.includes('ref("missing_model")')),
    ).toBe(true);
    expect(
      diagnostics.some((diagnostic) =>
        diagnostic.message.includes('source("raw", "missing_table")'),
      ),
    ).toBe(true);
  });
});
