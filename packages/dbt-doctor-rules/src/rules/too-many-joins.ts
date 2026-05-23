import type { Rule } from "../types.js";
import { TOO_MANY_JOINS_COUNT } from "../constants.js";
import {
  diagnosticPathForNode,
  isModelNode,
  isSourceNode,
  parentNodes,
} from "../utils/manifest-graph.js";
import { report } from "../utils/report.js";

const countSqlJoins = (sql: string): number => [...sql.matchAll(/\bjoin\b/gi)].length;

export const tooManyJoins: Rule = {
  id: "too-many-joins",
  severity: "warn",
  category: "SQL Quality",
  requiresManifest: true,
  recommendation: "Models with too many joins are harder to maintain and can degrade performance.",
  run: ({ manifest, readFile }) => {
    if (!manifest) return [];

    const diagnostics = [];

    for (const node of Object.values(manifest.nodes)) {
      if (!isModelNode(node)) continue;

      const joinParents = parentNodes(manifest, node).filter(
        (parent) => isModelNode(parent) || isSourceNode(parent),
      );
      const sql = node.originalFilePath ? readFile(node.originalFilePath) : "";
      const sqlJoinCount = countSqlJoins(sql);

      if (joinParents.length <= TOO_MANY_JOINS_COUNT && sqlJoinCount <= TOO_MANY_JOINS_COUNT) continue;

      diagnostics.push(
        report(
          tooManyJoins,
          diagnosticPathForNode(node),
          `Model "${node.name}" appears to have too many joins (${Math.max(joinParents.length, sqlJoinCount)})`,
          `Try breaking this model into smaller intermediate models (threshold: ${TOO_MANY_JOINS_COUNT}).`,
        ),
      );
    }

    return diagnostics;
  },
};
