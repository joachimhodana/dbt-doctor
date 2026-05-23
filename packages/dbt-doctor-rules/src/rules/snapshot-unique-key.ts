import type { Rule } from "../types.js";
import { isSnapshotsYaml } from "../utils/model-paths.js";
import { splitNamedYamlBlocks } from "../utils/yaml-blocks.js";
import { report } from "../utils/report.js";

const snapshotHasUniqueKey = (block: string): boolean => /unique_key:\s*\S/.test(block);

export const snapshotUniqueKey: Rule = {
  id: "snapshot-unique-key",
  severity: "error",
  category: "Configuration",
  tags: ["enterprise"],
  recommendation: "Snapshots must set unique_key for deduplication",
  run: ({ yamlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of yamlFiles) {
      if (!isSnapshotsYaml(file) && !/^\s*snapshots:/m.test(readFile(file))) continue;
      for (const snap of splitNamedYamlBlocks(readFile(file), "snapshots")) {
        if (snapshotHasUniqueKey(snap.block)) continue;
        diagnostics.push(
          report(
            snapshotUniqueKey,
            file,
            `Snapshot "${snap.name}" has no unique_key`,
            "Add unique_key under the snapshot definition (column name or list of columns).",
          ),
        );
      }
    }
    return diagnostics;
  },
};
