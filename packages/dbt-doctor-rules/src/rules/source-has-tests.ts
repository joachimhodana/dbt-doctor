import type { Rule } from "../types.js";
import { report } from "../utils/report.js";
import { listTestReferenceNames, singularTestMentionsSource } from "../utils/test-references.js";
import { splitSourceTableBlocks } from "../utils/yaml-blocks.js";

const hasSchemaTests = (tableBlock: string): boolean => listTestReferenceNames(tableBlock).length > 0;

const hasDataTests = (
  sourceName: string,
  tableName: string,
  testSqlFiles: string[],
  readFile: (path: string) => string,
): boolean => {
  for (const file of testSqlFiles) {
    if (singularTestMentionsSource(readFile(file), sourceName, tableName)) return true;
  }
  return false;
};

export const sourceHasTests: Rule = {
  id: "source-has-tests",
  severity: "warn",
  category: "Testing",
  recommendation: "Sources should declare at least one test (schema or data).",
  run: ({ yamlFiles, readFile, testSqlFiles }) => {
    const diagnostics = [];
    for (const file of yamlFiles) {
      const content = readFile(file);
      if (!/^\s*sources:\s*$/m.test(content)) continue;
      for (const table of splitSourceTableBlocks(content)) {
        const schema = hasSchemaTests(table.block);
        const data = hasDataTests(table.sourceName, table.tableName, testSqlFiles, readFile);
        if (schema || data) continue;
        diagnostics.push(
          report(
            sourceHasTests,
            file,
            `Source "${table.sourceName}.${table.tableName}" has no tests`,
            "Add at least one schema or singular data test for this source table.",
          ),
        );
      }
    }
    return diagnostics;
  },
};
