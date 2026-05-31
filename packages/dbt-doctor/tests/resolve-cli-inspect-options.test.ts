import { describe, expect, it } from "vite-plus/test";
import { resolveCliInspectOptions } from "../src/cli/utils/resolve-cli-inspect-options.js";

describe("resolveCliInspectOptions", () => {
  it("enables SQLFluff when --use-sqlfluff flag is set", () => {
    const options = resolveCliInspectOptions({ useSqlfluff: true }, null);
    expect(options.useSqlfluff).toBe(true);
  });

  it("enables SQLFluff from config when flag is not passed", () => {
    const options = resolveCliInspectOptions({}, { useSqlfluff: true });
    expect(options.useSqlfluff).toBe(true);
  });

  it("keeps SQLFluff disabled by default", () => {
    const options = resolveCliInspectOptions({}, null);
    expect(options.useSqlfluff).toBe(false);
  });
});
