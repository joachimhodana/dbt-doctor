import type { Rule } from "../types.js";
import { report } from "../utils/report.js";
import { offsetToLineColumn, parseSqlWithCst, walkCst } from "../utils/sql-cst.js";

type KeywordCapitalisationPolicy = "consistent" | "upper" | "lower" | "capitalise";

const VALID_POLICIES = new Set<KeywordCapitalisationPolicy>([
  "consistent",
  "upper",
  "lower",
  "capitalise",
]);

const isCapitalizable = (char: string): boolean => char.toLowerCase() !== char.toUpperCase();

const detectKeywordCase = (text: string): KeywordCapitalisationPolicy | null => {
  if (text.length === 0) return null;
  let hasLetter = false;
  for (const char of text) {
    if (isCapitalizable(char)) {
      hasLetter = true;
      break;
    }
  }
  if (!hasLetter) return null;

  if (text === text.toUpperCase()) return "upper";
  if (text === text.toLowerCase()) return "lower";
  if (text === text[0]?.toUpperCase() + text.slice(1).toLowerCase()) return "capitalise";
  return "consistent";
};

const resolvePolicy = (ruleConfig: Record<string, unknown>): KeywordCapitalisationPolicy => {
  const configured = ruleConfig.capitalisationPolicy;
  if (typeof configured === "string" && VALID_POLICIES.has(configured as KeywordCapitalisationPolicy)) {
    return configured as KeywordCapitalisationPolicy;
  }
  return "consistent";
};

const matchesPolicy = (text: string, policy: KeywordCapitalisationPolicy): boolean => {
  if (policy === "upper") return text === text.toUpperCase();
  if (policy === "lower") return text === text.toLowerCase();
  if (policy === "capitalise") return text === text[0]?.toUpperCase() + text.slice(1).toLowerCase();
  return true;
};

export const sqlKeywordsCase: Rule = {
  id: "sql-keywords-case",
  severity: "warn",
  category: "SQL Style",
  recommendation: "Use consistent keyword capitalization (SQLFluff-style).",
  tags: ["style", "phase5"],
  run: ({ sqlFiles, readFile, project, ruleConfig }) => {
    const diagnostics = [];
    const configuredPolicy = resolvePolicy(ruleConfig);

    for (const filePath of sqlFiles) {
      const content = readFile(filePath);
      const parsed = parseSqlWithCst(filePath, content, project.adapter);
      if (!parsed) continue;

      let inferredPolicy: KeywordCapitalisationPolicy | null = null;
      const keywords: Array<{ text: string; rangeStart: number }> = [];

      walkCst(parsed.cst, {
        keyword: (node: { text?: string; range?: [number, number] }) => {
          const text = node.text;
          const range = node.range;
          if (!text || !range || range.length < 1) return;
          const shape = detectKeywordCase(text);
          if (!shape) return;
          keywords.push({ text, rangeStart: range[0] });

          if (configuredPolicy === "consistent" && inferredPolicy === null && shape !== "consistent") {
            inferredPolicy = shape;
          }
        },
      });

      const effectivePolicy = configuredPolicy === "consistent" ? (inferredPolicy ?? "upper") : configuredPolicy;

      for (const keyword of keywords) {
        if (matchesPolicy(keyword.text, effectivePolicy)) continue;
        const position = offsetToLineColumn(content, keyword.rangeStart);
        diagnostics.push(
          report(
            sqlKeywordsCase,
            filePath,
            `Keyword \"${keyword.text}\" is not ${effectivePolicy}.`,
            `Use ${effectivePolicy} keyword capitalization consistently (compatible with SQLFluff capitalisation.keywords).`,
            position.line,
            position.column,
          ),
        );
      }
    }

    return diagnostics;
  },
};
