import type { Rule } from "../types.js";
import { report } from "../utils/report.js";

const CREATE_PROC_SP_PATTERN =
  /\bcreate\s+(?:or\s+alter\s+)?proc(?:edure)?\s+(\[?sp_[a-zA-Z_][\w$]*\]?)/gi;

export const sqlTsqlSpPrefix: Rule = {
  id: "sql-tsql-sp-prefix",
  severity: "warn",
  category: "SQL Convention",
  tags: ["style", "sql-style"],
  recommendation: "In T-SQL, avoid `sp_` prefix for user-defined procedures.",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      const content = readFile(file);
      for (const match of content.matchAll(CREATE_PROC_SP_PATTERN)) {
        diagnostics.push(
          report(
            sqlTsqlSpPrefix,
            file,
            `Procedure name ${(match[1] ?? "").replaceAll("[", "").replaceAll("]", "")} uses sp_ prefix`,
            "Use a non-`sp_` prefix for user-defined procedures in T-SQL.",
          ),
        );
      }
    }
    return diagnostics;
  },
};
