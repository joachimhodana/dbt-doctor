import type { Rule } from "../types.js";
import { report } from "../utils/report.js";

const BARE_TEMP_TABLE_PATTERN = /\b(?:from|join|into)\s+#([a-zA-Z_][\w$]*)\b/gi;

export const sqlTsqlBareTempTable: Rule = {
  id: "sql-tsql-bare-temp-table",
  severity: "warn",
  category: "SQL Convention",
  tags: ["style", "sql-style"],
  recommendation: "Avoid bare temporary-table references in reusable dbt SQL.",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      const content = readFile(file);
      for (const match of content.matchAll(BARE_TEMP_TABLE_PATTERN)) {
        diagnostics.push(
          report(
            sqlTsqlBareTempTable,
            file,
            `Temporary table reference "#${match[1] ?? ""}" detected`,
            "Prefer dbt models/CTEs over T-SQL temp tables in shared SQL code.",
          ),
        );
      }
    }
    return diagnostics;
  },
};
