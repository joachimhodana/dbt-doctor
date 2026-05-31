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

describe("jinja tag style", () => {
  let directory: string;

  afterEach(() => {
    if (directory) fs.rmSync(directory, { recursive: true, force: true });
  });

  it("flags missing/extra jinja tag padding", () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-jinja-style-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: fixture\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );
    writeFile(
      directory,
      "models/staging/stg_orders.sql",
      "select {{ref('orders')}} as x, {%if true%}1{% endif %} as y\n",
    );

    const diagnostics = runCustomRules({
      rootDirectory: directory,
      project: discoverProject(directory),
      ignoredTags: new Set(),
    }).filter((diagnostic) => diagnostic.rule === "jinja-tag-padding");

    expect(diagnostics.length).toBeGreaterThan(0);
  });
});
