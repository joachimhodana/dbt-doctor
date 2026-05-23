import type { Rule } from "../types.js";
import { parseStringList } from "../utils/configurable-rule.js";
import { report } from "../utils/report.js";

const extractConfigTags = (sql: string): Set<string> => {
  const tags = new Set<string>();

  for (const match of sql.matchAll(/\{\{\s*config\(([\s\S]*?)\)\s*\}\}/gi)) {
    const args = match[1] ?? "";
    const list = args.match(/\btags\s*=\s*\[([^\]]+)\]/i)?.[1];
    if (list) {
      for (const raw of list.split(",")) {
        const normalized = raw.trim().replace(/^['"]|['"]$/g, "");
        if (normalized.length > 0) tags.add(normalized);
      }
    }
    const scalar = args.match(/\btags\s*=\s*['\"]([^'\"]+)['\"]/i)?.[1];
    if (scalar) tags.add(scalar.trim());
  }

  return tags;
};

export const testTags: Rule = {
  id: "test-tags",
  severity: "warn",
  category: "Governance",
  recommendation:
    "Set `rules.test-tags.allowed` in .dbt-doctor to enforce allowed tags on singular tests.",
  run: (context) => {
    const allowedTags = parseStringList(context.ruleConfig.allowed);
    if (allowedTags.length === 0) return [];

    const allowedSet = new Set(allowedTags);
    const diagnostics = [];

    for (const file of context.testSqlFiles) {
      const tags = extractConfigTags(context.readFile(file));
      const hasAllowed = [...tags].some((tag) => allowedSet.has(tag));
      if (hasAllowed) continue;

      diagnostics.push(
        report(
          testTags,
          file,
          `Singular test is missing an allowed tag (${allowedTags.join(", ")})`,
          `Add config(tags=[...]) including one of: ${allowedTags.join(", ")}.`,
        ),
      );
    }

    return diagnostics;
  },
};
