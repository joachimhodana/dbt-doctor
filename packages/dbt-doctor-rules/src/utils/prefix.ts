import path from "node:path";
import type { Diagnostic } from "@dbt-doctor/types";
import type { Rule } from "../types.js";
import { report } from "./report.js";

export const checkLayerPrefix = (
  rule: Rule,
  sqlFiles: string[],
  pathSegments: string[],
  prefix: string,
  layerLabel: string,
): Diagnostic[] => {
  const diagnostics: Diagnostic[] = [];
  for (const file of sqlFiles) {
    const relative = file.replace(/\\/g, "/");
    if (!pathSegments.some((segment) => relative.includes(segment))) continue;
    const basename = path.basename(file, path.extname(file));
    if (basename.startsWith(prefix)) continue;
    diagnostics.push(
      report(
        rule,
        file,
        `${layerLabel} model "${basename}" should use ${prefix} prefix`,
        `Rename to ${prefix}<name> for consistent layer naming.`,
      ),
    );
  }
  return diagnostics;
};
