import { DEFAULT_MAX_CTE_COUNT } from "../constants.js";
import type { Rule } from "../types.js";
import { isModelSqlPath } from "../utils/model-paths.js";
import { report } from "../utils/report.js";
import { parseSqlWithCst, walkCstWithPath } from "../utils/sql-cst.js";

export const excessiveCteDepth: Rule = {
  id: "excessive-cte-depth",
  severity: "warn",
  category: "Best Practices",
  tags: ["enterprise"],
  recommendation: "Split models with many CTEs into intermediate models",
  run: ({ sqlFiles, readFile, project }) => {
    const diagnostics = [];
    const max = DEFAULT_MAX_CTE_COUNT;
    for (const file of sqlFiles) {
      if (!isModelSqlPath(file)) continue;
      const content = readFile(file);
      const parsed = parseSqlWithCst(file, content, project.adapter);
      if (!parsed) continue;

      let cteCount = 0;
      walkCstWithPath(parsed.cst, (node) => {
        if (node.type !== "with_clause") return;
        const withNode = node as { tables?: { items?: unknown[] } };
        cteCount += withNode.tables?.items?.length ?? 0;
      });

      if (cteCount <= max) continue;
      diagnostics.push(
        report(
          excessiveCteDepth,
          file,
          `Model has ${cteCount} CTE clauses (recommended max ${max})`,
          "Extract CTE chains into int_ models for readability and reuse.",
        ),
      );
    }
    return diagnostics;
  },
};
