import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { runCustomRules } from "dbt-doctor-rules";
import { discoverProject } from "@dbt-doctor/project-info";

const fixtureDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "fixtures/basic-dbt",
);

describe("runCustomRules", () => {
  it("runs dbt-doctor rules on fixture project", () => {
    const project = discoverProject(fixtureDir);
    const diagnostics = runCustomRules({
      rootDirectory: fixtureDir,
      project,
      ignoredTags: new Set(),
    });
    expect(Array.isArray(diagnostics)).toBe(true);
  });
});
