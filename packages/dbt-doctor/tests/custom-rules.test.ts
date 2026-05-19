import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { runCustomRules } from "dbt-doctor-rules";
import { discoverProject } from "@dbt-doctor/project-info";

const fixtureDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures/basic-dbt");

const ruleIds = (diagnostics: { rule: string }[]): string[] =>
  diagnostics.map((diagnostic) => diagnostic.rule);

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

  it("flags architecture anti-patterns in fixture models", () => {
    const project = discoverProject(fixtureDir);
    const diagnostics = runCustomRules({
      rootDirectory: fixtureDir,
      project,
      ignoredTags: new Set(),
    });
    const rules = ruleIds(diagnostics);

    expect(rules).toContain("source-in-downstream");
    expect(rules).toContain("direct-source-and-ref");
    expect(rules).toContain("staging-no-join");
    expect(rules).toContain("no-select-star");
    expect(rules).toContain("staging-naming-convention");
  });
});
