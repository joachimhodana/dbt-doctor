import type { Rule } from "../types.js";
import { isModelSqlPath } from "../utils/model-paths.js";
import { report } from "../utils/report.js";

const BUILTIN_MACROS = new Set([
  "ref",
  "source",
  "config",
  "var",
  "env_var",
  "this",
  "adapter",
  "target",
  "log",
  "exceptions",
  "return",
]);
const REF_PATTERN = /\{\{\s*-?\s*ref\s*\(\s*["']([^"']+)["']/gi;
const SOURCE_PATTERN = /\{\{\s*-?\s*source\s*\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']/gi;
const JINJA_CALL_PATTERN = /\{\{\s*-?\s*([a-zA-Z_][\w$]*)\s*\(/gi;
const HARD_RELATION_PATTERN = /\b(from|join)\s+([`"\[]?[a-zA-Z_][\w$]*[`"\]]?\.){1,2}[`"\[]?[a-zA-Z_][\w$]*[`"\]]?/i;
const MACRO_DEF_PATTERN = /\{%\s*macro\s+([a-zA-Z_][\w$]*)\s*\(/gi;

const collectKnownMacros = (
  macroSqlFiles: string[],
  readFile: (path: string) => string,
  manifestMacroNames: ReadonlySet<string>,
): Set<string> => {
  const names = new Set<string>(manifestMacroNames);
  for (const file of macroSqlFiles) {
    const content = readFile(file);
    for (const match of content.matchAll(MACRO_DEF_PATTERN)) {
      const macro = (match[1] ?? "").toLowerCase();
      if (macro) names.add(macro);
    }
  }
  return names;
};

export const scriptRefAndSource: Rule = {
  id: "script-ref-and-source",
  severity: "warn",
  category: "Architecture",
  recommendation:
    "Reference relations with valid {{ ref() }} / {{ source() }} and call only existing macros.",
  run: ({ sqlFiles, readFile, manifest, macroSqlFiles }) => {
    const diagnostics = [];
    const modelNames = new Set<string>();
    const sourceNames = new Set<string>();
    const macroNamesFromManifest = new Set<string>();

    if (manifest) {
      for (const node of Object.values(manifest.nodes)) {
        if (node.resourceType === "model") modelNames.add(node.name.toLowerCase());
        if (node.resourceType === "source") {
          const segments = node.uniqueId.split(".");
          if (segments.length >= 4) {
            sourceNames.add(
              `${segments[segments.length - 2]!.toLowerCase()}.${segments[segments.length - 1]!.toLowerCase()}`,
            );
          }
        }
        if (node.resourceType === "macro") macroNamesFromManifest.add(node.name.toLowerCase());
      }
    }
    const knownMacros = collectKnownMacros(macroSqlFiles, readFile, macroNamesFromManifest);

    for (const file of sqlFiles) {
      if (!isModelSqlPath(file)) continue;
      const content = readFile(file);

      if (HARD_RELATION_PATTERN.test(content)) {
        diagnostics.push(
          report(
            scriptRefAndSource,
            file,
            "Model SQL uses hardcoded relation references without ref()/source().",
            "Replace raw schema.table references with {{ ref() }} or {{ source() }}.",
          ),
        );
      }

      if (manifest) {
        for (const match of content.matchAll(REF_PATTERN)) {
          const target = (match[1] ?? "").toLowerCase();
          if (!target || modelNames.has(target)) continue;
          diagnostics.push(
            report(
              scriptRefAndSource,
              file,
              `ref("${match[1]}") target does not exist in manifest`,
              "Use an existing model name in ref().",
            ),
          );
        }
        for (const match of content.matchAll(SOURCE_PATTERN)) {
          const src = (match[1] ?? "").toLowerCase();
          const tbl = (match[2] ?? "").toLowerCase();
          if (!src || !tbl || sourceNames.has(`${src}.${tbl}`)) continue;
          diagnostics.push(
            report(
              scriptRefAndSource,
              file,
              `source("${match[1]}", "${match[2]}") target does not exist in manifest`,
              "Use an existing source and table name in source().",
            ),
          );
        }
      }

      for (const match of content.matchAll(JINJA_CALL_PATTERN)) {
        const call = (match[1] ?? "").toLowerCase();
        if (!call || BUILTIN_MACROS.has(call) || knownMacros.has(call)) continue;
        diagnostics.push(
          report(
            scriptRefAndSource,
            file,
            `Macro call "${match[1]}(...)" not found`,
            "Define the macro or remove the unknown macro call.",
          ),
        );
      }
    }

    return diagnostics;
  },
};
