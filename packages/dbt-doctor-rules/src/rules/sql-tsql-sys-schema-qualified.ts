import type { Rule } from "../types.js";
import { report } from "../utils/report.js";

const SYS_OBJECT_PATTERN = /\bfrom\s+(objects|columns|tables)\b/gi;

export const sqlTsqlSysSchemaQualified: Rule = {
  id: "sql-tsql-sys-schema-qualified",
  severity: "warn",
  category: "SQL Convention",
  recommendation: "System catalogs should be schema-qualified in T-SQL.",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      const content = readFile(file);
      for (const match of content.matchAll(SYS_OBJECT_PATTERN)) {
        diagnostics.push(
          report(
            sqlTsqlSysSchemaQualified,
            file,
            `Potential unqualified system object "${match[1] ?? ""}"`,
            "Use schema-qualified system object names (for example sys.objects).",
          ),
        );
      }
    }
    return diagnostics;
  },
};
