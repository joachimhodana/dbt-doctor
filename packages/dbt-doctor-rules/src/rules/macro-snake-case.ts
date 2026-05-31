import path from "node:path";
import type { Rule } from "../types.js";
import { report } from "../utils/report.js";

const MACRO_DEF_PATTERN = /\{%-?\s*macro\s+(\w+)/g;
const SNAKE_CASE = /^[a-z0-9_]+$/;

const macroNamesInSql = (content: string): string[] => {
  const names: string[] = [];
  for (const match of content.matchAll(MACRO_DEF_PATTERN)) {
    names.push(match[1]);
  }
  return names;
};

export const macroSnakeCase: Rule = {
  id: "macro-snake-case",
  severity: "warn",
  category: "Best Practices",
  tags: ["strict"],
  recommendation: "Macro names should use snake_case (lowercase letters, digits, underscores)",
  run: ({ macroSqlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of macroSqlFiles) {
      const names = macroNamesInSql(readFile(file));
      const toCheck = names.length > 0 ? names : [path.basename(file, path.extname(file))];
      for (const name of toCheck) {
        if (SNAKE_CASE.test(name)) continue;
        diagnostics.push(
          report(
            macroSnakeCase,
            file,
            `Macro "${name}" should use snake_case naming`,
            "Rename to lowercase with underscores (e.g. my_macro_name).",
          ),
        );
      }
    }
    return diagnostics;
  },
};
