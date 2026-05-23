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

describe("manifest rules", () => {
  let dir: string;

  afterEach(() => {
    if (dir) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("flags staging-to-staging dependencies and unused sources", () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-manifest-"));

    writeFile(
      dir,
      "dbt_project.yml",
      'name: manifest_fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(dir, "models/staging/stg_users.sql", "select 1 as id\n");
    writeFile(dir, "models/staging/stg_orders.sql", "select 1 as id\n");
    writeFile(
      dir,
      "models/_sources/raw.yml",
      "version: 2\nsources:\n  - name: raw\n    tables:\n      - name: users\n      - name: events\n",
    );

    writeFile(
      dir,
      "target/manifest.json",
      JSON.stringify({
        nodes: {
          "model.manifest_fixture.stg_users": {
            unique_id: "model.manifest_fixture.stg_users",
            name: "stg_users",
            resource_type: "model",
            original_file_path: "models/staging/stg_users.sql",
            depends_on: { nodes: ["source.manifest_fixture.raw.users"] },
          },
          "model.manifest_fixture.stg_orders": {
            unique_id: "model.manifest_fixture.stg_orders",
            name: "stg_orders",
            resource_type: "model",
            original_file_path: "models/staging/stg_orders.sql",
            depends_on: {
              nodes: [
                "model.manifest_fixture.stg_users",
                "source.manifest_fixture.raw.users",
              ],
            },
          },
        },
        sources: {
          "source.manifest_fixture.raw.users": {
            unique_id: "source.manifest_fixture.raw.users",
            name: "users",
            resource_type: "source",
            original_file_path: "models/_sources/raw.yml",
            depends_on: { nodes: [] },
          },
          "source.manifest_fixture.raw.events": {
            unique_id: "source.manifest_fixture.raw.events",
            name: "events",
            resource_type: "source",
            original_file_path: "models/_sources/raw.yml",
            depends_on: { nodes: [] },
          },
        },
        parent_map: {
          "model.manifest_fixture.stg_orders": [
            "model.manifest_fixture.stg_users",
            "source.manifest_fixture.raw.users",
          ],
        },
      }),
    );

    const diagnostics = runCustomRules({
      rootDirectory: dir,
      project: discoverProject(dir),
      ignoredTags: new Set(),
    });

    const rules = diagnostics.map((diagnostic) => diagnostic.rule);
    expect(rules).toContain("staging-depends-on-staging");
    expect(rules).toContain("unused-sources");
  });

  it("skips manifest-only rules when manifest is missing", () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-no-manifest-"));

    writeFile(
      dir,
      "dbt_project.yml",
      'name: no_manifest_fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(dir, "models/staging/stg_users.sql", "select 1 as id\n");

    const diagnostics = runCustomRules({
      rootDirectory: dir,
      project: discoverProject(dir),
      ignoredTags: new Set(),
    });

    const rules = diagnostics.map((diagnostic) => diagnostic.rule);
    expect(rules).not.toContain("staging-depends-on-staging");
    expect(rules).not.toContain("unused-sources");
  });
});
