import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { discoverProject } from "@dbt-doctor/project-info";

const fixtureDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures/basic-dbt");

describe("discoverProject", () => {
  it("detects a minimal dbt project", () => {
    const project = discoverProject(fixtureDir);
    expect(project.projectName).toBe("basic_dbt");
    expect(project.modelPaths).toContain("models");
    expect(project.sourceFileCount).toBeGreaterThan(0);
  });
});
