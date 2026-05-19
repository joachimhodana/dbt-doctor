import path from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vite-plus/test";
import { runCustomRules } from "dbt-doctor-rules";
import { discoverProject } from "@dbt-doctor/project-info";

const fixtureDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures/basic-dbt");

describe("runCustomRules", () => {
  let rules: string[];

  beforeAll(() => {
    const project = discoverProject(fixtureDir);
    rules = runCustomRules({
      rootDirectory: fixtureDir,
      project,
      ignoredTags: new Set(),
    }).map((diagnostic) => diagnostic.rule);
  });

  it("flags architecture anti-patterns in fixture models", () => {
    expect(rules).toContain("source-in-downstream");
    expect(rules).toContain("direct-source-and-ref");
    expect(rules).toContain("staging-no-join");
    expect(rules).toContain("no-select-star");
    expect(rules).toContain("staging-naming-convention");
    expect(rules).toContain("model-line-length");
  });

  it("flags strict documentation and governance rules", () => {
    expect(rules).toContain("per-model-schema-yml");
    expect(rules).toContain("undocumented-model");
    expect(rules).toContain("seed-documented");
    expect(rules).toContain("macro-documented");
    expect(rules).toContain("model-contract-enforced");
    expect(rules).toContain("no-abbreviations-in-names");
    expect(rules).toContain("recommended-dbt-packages");
  });

  it("can ignore enterprise-tagged rules", () => {
    const project = discoverProject(fixtureDir);
    const ignored = runCustomRules({
      rootDirectory: fixtureDir,
      project,
      ignoredTags: new Set(["enterprise"]),
    }).map((d) => d.rule);
    expect(ignored).not.toContain("column-description-required");
    expect(ignored).not.toContain("model-owner-or-meta");
  });

  it("can ignore strict-tagged rules", () => {
    const project = discoverProject(fixtureDir);
    const ignored = runCustomRules({
      rootDirectory: fixtureDir,
      project,
      ignoredTags: new Set(["strict"]),
    }).map((d) => d.rule);
    expect(ignored).not.toContain("per-model-schema-yml");
    expect(ignored).not.toContain("model-contract-enforced");
  });
});
