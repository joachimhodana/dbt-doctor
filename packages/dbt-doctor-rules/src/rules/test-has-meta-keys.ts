import type { Rule } from "../types.js";
import { parseStringList } from "../utils/configurable-rule.js";
import { report } from "../utils/report.js";

const hasConfigMetaKey = (sql: string, key: string): boolean => {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\{\\{\\s*config\\([\\s\\S]*?meta\\s*=\\s*\\{[\\s\\S]*?['\"]${escaped}['\"]\\s*:`, "i").test(
    sql,
  );
};

export const testHasMetaKeys: Rule = {
  id: "test-has-meta-keys",
  severity: "warn",
  category: "Governance",
  recommendation:
    "Set `rules.test-has-meta-keys.required` in .dbt-doctor to enforce required meta keys on singular tests.",
  run: (context) => {
    const requiredKeys = parseStringList(context.ruleConfig.required);
    if (requiredKeys.length === 0) return [];

    const diagnostics = [];

    for (const file of context.testSqlFiles) {
      const sql = context.readFile(file);
      const missing = requiredKeys.filter((key) => !hasConfigMetaKey(sql, key));
      if (missing.length === 0) continue;

      diagnostics.push(
        report(
          testHasMetaKeys,
          file,
          `Singular test is missing required meta keys: ${missing.join(", ")}`,
          `Add config(meta={ ... }) with keys: ${requiredKeys.join(", ")}.`,
        ),
      );
    }

    return diagnostics;
  },
};
