import type { Diagnostic } from "@dbt-doctor/types";
import type { Rule } from "../types.js";
import { report } from "../utils/report.js";
import { offsetToLineColumn, parseSqlWithCst, walkCstWithPath } from "../utils/sql-cst.js";

interface CaseExprNode {
  type?: string;
  range?: [number, number];
  expr?: unknown;
  clauses?: Array<{ type?: string; condition?: unknown }>;
}

const extractComparedIdentifier = (condition: unknown): string | null => {
  const binary = condition as {
    type?: string;
    operator?: string;
    left?: { type?: string; text?: string };
  };
  if (binary?.type !== "binary_expr" || binary.operator !== "=") return null;
  if (binary.left?.type !== "identifier" || !binary.left.text) return null;
  return binary.left.text;
};

const isConvertibleToSimpleCase = (node: CaseExprNode): boolean => {
  if (node.expr) return false;
  const clauses = node.clauses ?? [];
  const whens = clauses.filter((clause) => clause.type === "case_when");
  if (whens.length < 2) return false;

  let sharedIdentifier: string | null = null;
  for (const when of whens) {
    const currentIdentifier = extractComparedIdentifier(when.condition);
    if (!currentIdentifier) return false;
    if (sharedIdentifier === null) {
      sharedIdentifier = currentIdentifier;
      continue;
    }
    if (sharedIdentifier !== currentIdentifier) return false;
  }

  return sharedIdentifier !== null;
};

export const sqlSimpleCasePreferred: Rule = {
  id: "sql-simple-case-preferred",
  severity: "warn",
  category: "SQL Style",
  recommendation: "Prefer simple CASE form when all WHEN clauses compare the same expression.",
  tags: ["style", "phase5"],
  run: ({ sqlFiles, readFile, project }) => {
    const diagnostics: Diagnostic[] = [];

    for (const filePath of sqlFiles) {
      const content = readFile(filePath);
      const parsed = parseSqlWithCst(filePath, content, project.adapter);
      if (!parsed) continue;

      walkCstWithPath(parsed.cst, (node, path) => {
        if (node.type !== "case_expr") return;

        const parent = path[path.length - 1] as { type?: string } | undefined;
        if (parent?.type === "case_expr") return;

        const caseNode = node as CaseExprNode;
        if (!isConvertibleToSimpleCase(caseNode) || !caseNode.range) return;

        const position = offsetToLineColumn(content, caseNode.range[0]);
        diagnostics.push(
          report(
            sqlSimpleCasePreferred,
            filePath,
            "CASE expression can be simplified to simple CASE form.",
            "Rewrite as `CASE <expr> WHEN ... THEN ... END` when all WHEN clauses compare the same expression (SQLFluff ST02 parity).",
            position.line,
            position.column,
          ),
        );
      });
    }

    return diagnostics;
  },
};
