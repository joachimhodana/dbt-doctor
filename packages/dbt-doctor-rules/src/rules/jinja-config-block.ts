import type { Rule } from "../types.js";
import { report } from "../utils/report.js";

export const jinjaConfigBlock: Rule = {
  id: "jinja-config-block",
  severity: "warn",
  category: "Configuration",
  recommendation: "Put model config in a config() block at the top of the file",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      const content = readFile(file);
      if (!/\{\%\s*set\s+/.test(content) && !/\{\{\s*config/.test(content)) continue;
      if (/^\s*\{\{-?\s*config/m.test(content)) continue;
      if (content.length < 200) continue;
      diagnostics.push(
        report(
          jinjaConfigBlock,
          file,
          "Model may benefit from a top-level config() block",
          "Place {{ config(...) }} near the top for discoverability.",
        ),
      );
    }
    return diagnostics;
  },
};
