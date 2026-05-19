import type { Rule } from "../types.js";
import { report } from "../utils/report.js";

export const genericTestPresent: Rule = {
  id: "generic-test-present",
  severity: "warn",
  category: "Testing",
  recommendation: "Add not_null or unique tests on primary keys",
  run: ({ yamlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of yamlFiles) {
      const relative = file.replace(/\\/g, "/");
      if (!relative.includes("/models/") || !/schema\.(yml|yaml)$/.test(relative)) continue;
      const columnBlocks = readFile(file).split(/\n\s+-\s+name:\s+/).slice(1);
      for (const block of columnBlocks) {
        const columnName = block.match(/^["']?(\w+)/)?.[1];
        if (!columnName || !/(^id$|_id$|_key$)/i.test(columnName)) continue;
        if (/tests:/.test(block)) continue;
        diagnostics.push(
          report(
            genericTestPresent,
            file,
            `Column "${columnName}" may need generic tests (not_null, unique)`,
            "Add tests under the column in schema.yml.",
          ),
        );
      }
    }
    return diagnostics;
  },
};
