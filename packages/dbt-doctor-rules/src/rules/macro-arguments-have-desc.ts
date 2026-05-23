import type { Rule } from "../types.js";
import { report } from "../utils/report.js";
import { splitNamedYamlBlocks } from "../utils/yaml-blocks.js";

const hasArgumentWithoutDescription = (macroBlock: string): boolean => {
  const argsSection = macroBlock.match(/\barguments:\s*\n([\s\S]*)/i)?.[1];
  if (!argsSection) return false;

  for (const argChunk of argsSection.split(/\n\s*-\s+name:\s+/).slice(1)) {
    if (!/\bdescription:\s*\S/i.test(argChunk)) return true;
  }
  return false;
};

export const macroArgumentsHaveDesc: Rule = {
  id: "macro-arguments-have-desc",
  severity: "warn",
  category: "Documentation",
  recommendation: "Every macro argument should include a description in macros YAML.",
  run: (context) => {
    if (context.ruleConfig.enabled !== true) return [];
    const diagnostics = [];

    for (const file of context.yamlFiles) {
      const relative = file.replace(/\\/g, "/");
      if (!/\.(yml|yaml)$/i.test(file)) continue;
      if (!relative.includes("/macros/") && !relative.startsWith("macros/")) continue;

      for (const macro of splitNamedYamlBlocks(context.readFile(file), "macros")) {
        if (!hasArgumentWithoutDescription(macro.block)) continue;
        diagnostics.push(
          report(
            macroArgumentsHaveDesc,
            file,
            `Macro "${macro.name}" has arguments without descriptions`,
            "Add description for every macro argument in macros YAML.",
          ),
        );
      }
    }

    return diagnostics;
  },
};
