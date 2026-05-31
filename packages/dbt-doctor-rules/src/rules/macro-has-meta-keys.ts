import type { Rule } from "../types.js";
import { blockHasMetaKey, parseStringList } from "../utils/configurable-rule.js";
import { report } from "../utils/report.js";
import { splitNamedYamlBlocks } from "../utils/yaml-blocks.js";

const isMacroYamlPath = (filePath: string): boolean => {
  const relative = filePath.replace(/\\/g, "/");
  return relative.includes("/macros/") || relative.startsWith("macros/");
};

export const macroHasMetaKeys: Rule = {
  id: "macro-has-meta-keys",
  severity: "warn",
  category: "Governance",
  tags: ["enterprise"],
  recommendation:
    "Set `rules.macro-has-meta-keys.required` to enforce required macro-level meta keys.",
  run: ({ yamlFiles, readFile, ruleConfig }) => {
    const requiredKeys = parseStringList(ruleConfig.required);
    if (requiredKeys.length === 0) return [];

    const diagnostics = [];

    for (const file of yamlFiles) {
      if (!isMacroYamlPath(file)) continue;
      const content = readFile(file);
      for (const macro of splitNamedYamlBlocks(content, "macros")) {
        const missing = requiredKeys.filter((key) => !blockHasMetaKey(macro.block, key));
        if (missing.length === 0) continue;

        diagnostics.push(
          report(
            macroHasMetaKeys,
            file,
            `Macro "${macro.name}" is missing required meta keys: ${missing.join(", ")}`,
            `Add meta keys on the macro: ${requiredKeys.join(", ")}.`,
          ),
        );
      }
    }

    return diagnostics;
  },
};
