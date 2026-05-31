import type { Rule } from "../types.js";
import { isStagingModelPath } from "../utils/path-layer.js";
import { report } from "../utils/report.js";
import { offsetToLineColumn, parseSqlWithCst, walkCstWithPath } from "../utils/sql-cst.js";

/**
 * Staging should rename/recast only — joins belong in intermediate/marts.
 * @see https://docs.getdbt.com/best-practices/how-we-structure/2-staging
 */
export const stagingNoJoin: Rule = {
  id: "staging-no-join",
  severity: "warn",
  category: "Architecture",
  recommendation: "Avoid joins in staging; combine entities in intermediate or marts",
  run: ({ sqlFiles, readFile, project }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      if (!isStagingModelPath(file)) continue;
      const content = readFile(file);
      const parsed = parseSqlWithCst(file, content, project.adapter);
      if (!parsed) continue;

      let joinOffset: number | null = null;
      walkCstWithPath(parsed.cst, (node) => {
        if (joinOffset !== null) return;
        if (node.type !== "join_expr" || !node.range) return;
        joinOffset = node.range[0];
      });
      if (joinOffset === null) continue;

      const position = offsetToLineColumn(content, joinOffset);
      diagnostics.push(
        report(
          stagingNoJoin,
          file,
          "Staging model contains a JOIN — prefer one staging model per source entity",
          "Move joins to an int_ model, then build marts from refs.",
          position.line,
          position.column,
        ),
      );
    }
    return diagnostics;
  },
};
