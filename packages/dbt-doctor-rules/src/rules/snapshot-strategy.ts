import type { Rule } from "../types.js";
import { isSnapshotsYaml } from "../utils/model-paths.js";
import { splitNamedYamlBlocks } from "../utils/yaml-blocks.js";
import { report } from "../utils/report.js";

const snapshotHasStrategy = (block: string): boolean => {
  if (!/strategy:\s*\S/.test(block)) return false;
  if (/strategy:\s*timestamp/i.test(block)) return /updated_at:/.test(block);
  if (/strategy:\s*check/i.test(block)) return /check_cols:/.test(block);
  return true;
};

export const snapshotStrategy: Rule = {
  id: "snapshot-strategy",
  severity: "warn",
  category: "Configuration",
  tags: ["enterprise"],
  recommendation: "Snapshots need strategy and updated_at or check_cols",
  run: ({ yamlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of yamlFiles) {
      if (!isSnapshotsYaml(file) && !/^\s*snapshots:/m.test(readFile(file))) continue;
      for (const snap of splitNamedYamlBlocks(readFile(file), "snapshots")) {
        if (snapshotHasStrategy(snap.block)) continue;
        diagnostics.push(
          report(
            snapshotStrategy,
            file,
            `Snapshot "${snap.name}" is missing strategy configuration (and updated_at or check_cols)`,
            "Add strategy: timestamp with updated_at, or strategy: check with check_cols.",
          ),
        );
      }
    }
    return diagnostics;
  },
};
