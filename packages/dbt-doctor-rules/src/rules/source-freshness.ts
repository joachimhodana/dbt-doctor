import type { Rule } from "../types.js";
import { report } from "../utils/report.js";

export const sourceFreshness: Rule = {
  id: "source-freshness",
  severity: "warn",
  category: "Sources",
  recommendation: "Configure freshness on production sources",
  run: ({ yamlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of yamlFiles) {
      const relative = file.replace(/\\/g, "/");
      if (!relative.includes("_sources") && !relative.includes("/sources/")) continue;
      const content = readFile(file);
      if (!/^\s*sources:/m.test(content)) continue;
      const sourceBlocks = content.split(/\n\s*-\s+name:\s+/).slice(1);
      for (const block of sourceBlocks) {
        if (/freshness:/.test(block)) continue;
        const sourceName = block.match(/^["']?(\w+)/)?.[1] ?? "source";
        diagnostics.push(
          report(
            sourceFreshness,
            file,
            `Source "${sourceName}" has no freshness configuration`,
            "Add freshness.warn_after / error_after for SLA monitoring.",
          ),
        );
      }
    }
    return diagnostics;
  },
};
