import type { Rule } from "../types.js";
import { offsetToLineColumn } from "../utils/sql-cst.js";
import {
  findJinjaRanges,
  isDbtMacroSelectTarget,
  isInsideRanges,
  stripLineComments,
} from "../utils/jinja-sql-scan.js";
import { report } from "../utils/report.js";

const SELECT_FROM_PATTERN = /\bselect\b([\s\S]*?)\bfrom\b/gi;

const splitSelectTargets = (body: string): string[] => {
  const targets: string[] = [];
  let depth = 0;
  let current = "";

  for (let i = 0; i < body.length; i += 1) {
    const char = body[i]!;
    if (char === "(") depth += 1;
    if (char === ")") depth = Math.max(0, depth - 1);

    if (char === "," && depth === 0) {
      const trimmed = current.trim();
      if (trimmed.length > 0) targets.push(trimmed);
      current = "";
      continue;
    }

    current += char;
  }

  const tail = current.trim();
  if (tail.length > 0) targets.push(tail);
  return targets;
};

const hasAlias = (target: string): boolean => {
  if (/\bas\s+[a-zA-Z_][\w$]*$/i.test(target)) return true;
  if (/\)\s+[a-zA-Z_][\w$]*$/i.test(target)) return true;
  return false;
};

const isSimpleReference = (target: string): boolean =>
  /^[a-zA-Z_][\w$]*(\.[a-zA-Z_][\w$]*)?$/.test(target) ||
  /^\*$/.test(target) ||
  /^[a-zA-Z_][\w$]*\.\*+$/.test(target) ||
  /^\*\s+exclude\s*\([^)]*\)$/i.test(target);

const isExpressionTarget = (target: string): boolean =>
  /\(|\+|\-|\*|\/|\bcase\b|\bcoalesce\b|\bnullif\b|\bcast\b/i.test(target);

export const sqlExpressionAliasRequired: Rule = {
  id: "sql-expression-alias-required",
  severity: "warn",
  category: "SQL Style",
  tags: ["style", "sql-style"],
  recommendation:
    "Alias expression targets in SELECT lists for readability and stable downstream references.",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];

    for (const file of sqlFiles) {
      const content = readFile(file);
      const jinjaRanges = findJinjaRanges(content);

      for (const match of content.matchAll(SELECT_FROM_PATTERN)) {
        const selectStart = match.index ?? 0;
        if (isInsideRanges(selectStart, jinjaRanges)) continue;

        const selectBody = (match[1] ?? "").trim();
        if (!selectBody) continue;

        const targets = splitSelectTargets(selectBody);
        for (const target of targets) {
          const normalized = stripLineComments(target).replace(/\s+/g, " ").trim();
          if (!normalized) continue;
          if (isSimpleReference(normalized)) continue;
          if (!isExpressionTarget(normalized)) continue;
          if (hasAlias(normalized)) continue;
          if (isDbtMacroSelectTarget(normalized)) continue;

          const targetIndex = selectStart + selectBody.indexOf(normalized);
          if (targetIndex < selectStart) continue;
          if (isInsideRanges(targetIndex, jinjaRanges)) continue;

          const position = offsetToLineColumn(content, Math.max(0, targetIndex));
          diagnostics.push(
            report(
              sqlExpressionAliasRequired,
              file,
              `Expression target "${normalized}" is missing an alias`,
              "Add `AS <alias>` to expression targets in SELECT lists.",
              position.line,
              position.column,
            ),
          );
        }
      }
    }

    return diagnostics;
  },
};
