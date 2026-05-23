import type { Rule } from "../types.js";
import { report } from "../utils/report.js";
import { offsetToLineColumn, parseSqlWithCst, walkCstWithPath } from "../utils/sql-cst.js";
import {
  isLowerCase,
  isUpperCase,
  matchesSqlCasePolicy,
  resolveSqlCasePolicy,
  type SqlCasePolicy,
} from "../utils/sql-case-policy.js";

type IdentifierCaseShape = "upper" | "lower" | "mixed";

const isQuotedIdentifier = (rawText: string): boolean => {
  const start = rawText[0];
  return start === '"' || start === '`' || start === '[';
};

const detectCase = (text: string): IdentifierCaseShape => {
  if (text.length === 0 || isLowerCase(text)) return "lower";
  if (isUpperCase(text)) return "upper";
  return "mixed";
};

const isFunctionNameIdentifier = (
  path: Array<{ type?: string }>,
  node: { type?: string },
): boolean => {
  const parent = path[path.length - 1] as { type?: string; name?: unknown } | undefined;
  return parent?.type === "func_call" && parent.name === node;
};

export const sqlUnquotedIdentifiersCase: Rule = {
  id: "sql-unquoted-identifiers-case",
  severity: "warn",
  category: "SQL Style",
  recommendation: "Use consistent capitalization for unquoted identifiers.",
  tags: ["style", "phase5"],
  run: ({ sqlFiles, readFile, project, ruleConfig }) => {
    const diagnostics = [];
    const configuredPolicy = resolveSqlCasePolicy(ruleConfig);

    for (const filePath of sqlFiles) {
      const content = readFile(filePath);
      const parsed = parseSqlWithCst(filePath, content, project.adapter);
      if (!parsed) continue;

      const identifiers: Array<{ text: string; offset: number }> = [];
      let inferredPolicy: SqlCasePolicy | null = null;

      walkCstWithPath(parsed.cst, (node, path) => {
        if (node.type !== "identifier") return;
        const identifier = node as { text?: string; range?: [number, number] };
        if (!identifier.text || !identifier.range) return;
        if (isQuotedIdentifier(identifier.text)) return;
        if (isFunctionNameIdentifier(path, node)) return;

        const shape = detectCase(identifier.text);
        identifiers.push({ text: identifier.text, offset: identifier.range[0] });
        if (configuredPolicy === "consistent" && inferredPolicy === null && shape !== "mixed") {
          inferredPolicy = shape;
        }
      });

      const effectivePolicy = configuredPolicy === "consistent" ? (inferredPolicy ?? "lower") : configuredPolicy;
      for (const identifier of identifiers) {
        if (matchesSqlCasePolicy(identifier.text, effectivePolicy)) continue;

        const position = offsetToLineColumn(content, identifier.offset);
        diagnostics.push(
          report(
            sqlUnquotedIdentifiersCase,
            filePath,
            `Identifier \"${identifier.text}\" is not ${effectivePolicy}.`,
            `Use ${effectivePolicy} capitalization for unquoted identifiers (SQLFluff capitalisation.identifiers style).`,
            position.line,
            position.column,
          ),
        );
      }
    }

    return diagnostics;
  },
};
