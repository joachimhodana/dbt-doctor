import path from "node:path";
import type { Rule } from "../types.js";
import { splitNamedYamlBlocks, blockHasDescription } from "../utils/yaml-blocks.js";
import { report } from "../utils/report.js";

const MACRO_DEF_PATTERN = /\{%-?\s*macro\s+(\w+)/g;

const macroNamesInSql = (content: string): string[] => {
  const names: string[] = [];
  for (const match of content.matchAll(MACRO_DEF_PATTERN)) {
    names.push(match[1]);
  }
  return names;
};

const collectDocumentedMacros = (
  yamlFiles: string[],
  readFile: (path: string) => string,
): Set<string> => {
  const documented = new Set<string>();
  for (const file of yamlFiles) {
    const relative = file.replace(/\\/g, "/");
    if (!relative.includes("/macros/") && !relative.startsWith("macros/")) continue;
    if (!/\.(yml|yaml)$/i.test(file)) continue;
    for (const block of splitNamedYamlBlocks(readFile(file), "macros")) {
      if (blockHasDescription(block.block)) {
        documented.add(block.name);
      }
    }
  }
  return documented;
};

export const macroDocumented: Rule = {
  id: "macro-documented",
  severity: "warn",
  category: "Documentation",
  tags: ["strict"],
  recommendation: "Document every macro in macros/*.yml with a description",
  run: ({ macroSqlFiles, yamlFiles, readFile }) => {
    if (macroSqlFiles.length === 0) return [];
    const documented = collectDocumentedMacros(yamlFiles, readFile);
    const diagnostics = [];
    for (const file of macroSqlFiles) {
      const names = macroNamesInSql(readFile(file));
      const toCheck = names.length > 0 ? names : [path.basename(file, path.extname(file))];
      for (const name of toCheck) {
        if (documented.has(name)) continue;
        diagnostics.push(
          report(
            macroDocumented,
            file,
            `Macro "${name}" is not documented in macros YAML`,
            `Add a macros: entry for "${name}" with description in macros/*.yml.`,
          ),
        );
      }
    }
    return diagnostics;
  },
};
