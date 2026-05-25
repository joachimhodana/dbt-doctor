import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vite-plus/test";
import { inspect } from "../src/inspect.js";

const fixture = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures/basic-dbt");
const opts = { silent: true, offline: true, configOverride: { customRulesOnly: true } as const };

describe("inspect", () => {
  it("returns diagnostics and project metadata for a basic fixture", async () => {
    const result = await inspect(fixture, opts);
    expect(result.project.projectName).toBe("basic_dbt");
    expect(Array.isArray(result.diagnostics)).toBe(true);
  });
});
