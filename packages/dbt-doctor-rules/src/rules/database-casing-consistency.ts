import type { Rule } from "../types.js";
import { report } from "../utils/report.js";

const DB_REF_PATTERN = /\b(?:from|join)\s+([a-zA-Z_][\w]*)\.[a-zA-Z_][\w]*\.[a-zA-Z_][\w]*/gi;

export const databaseCasingConsistency: Rule = {
  id: "database-casing-consistency",
  severity: "warn",
  category: "SQL Quality",
  recommendation: "Use consistent casing for database identifiers in three-part table names.",
  run: (context) => {
    if (context.ruleConfig.enabled !== true) return [];
    const diagnostics = [];
    const seenByLower = new Map<string, string>();

    for (const file of context.sqlFiles) {
      const content = context.readFile(file);
      for (const match of content.matchAll(DB_REF_PATTERN)) {
        const dbName = match[1];
        const lower = dbName.toLowerCase();
        const existing = seenByLower.get(lower);
        if (!existing) {
          seenByLower.set(lower, dbName);
          continue;
        }
        if (existing === dbName) continue;

        diagnostics.push(
          report(
            databaseCasingConsistency,
            file,
            `Database casing mismatch for "${lower}": saw both "${existing}" and "${dbName}"`,
            "Use one consistent database casing across SQL files.",
          ),
        );
      }
    }

    return diagnostics;
  },
};
