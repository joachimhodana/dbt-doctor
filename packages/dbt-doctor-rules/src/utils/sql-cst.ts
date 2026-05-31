import { cstVisitor, parse } from "sql-parser-cst";

export type SqlParserDialect = "bigquery" | "mariadb" | "mysql" | "postgresql" | "sqlite";

export interface ParsedSqlFile {
  filePath: string;
  content: string;
  cst: unknown;
}

const mapAdapterToDialect = (adapter: string | null | undefined): SqlParserDialect => {
  const normalized = (adapter ?? "").toLowerCase();
  if (normalized.includes("bigquery")) return "bigquery";
  if (normalized.includes("mysql")) return "mysql";
  if (normalized.includes("mariadb")) return "mariadb";
  if (
    normalized.includes("postgres") ||
    normalized.includes("redshift") ||
    normalized.includes("trino") ||
    normalized.includes("duckdb")
  ) {
    return "postgresql";
  }
  return "sqlite";
};

const maskTemplateChunk = (chunk: string): string =>
  chunk
    .split("")
    .map((char) => (char === "\n" || char === "\r" ? char : "x"))
    .join("");

const stripJinjaForParser = (sql: string): string => {
  const JINJA_BLOCK_PATTERN = /\{\{[\s\S]*?\}\}|\{%[\s\S]*?%\}|\{#[\s\S]*?#\}/g;
  return sql.replace(JINJA_BLOCK_PATTERN, (chunk) => maskTemplateChunk(chunk));
};

export const parseSqlWithCst = (
  filePath: string,
  sql: string,
  adapter: string | null | undefined,
): ParsedSqlFile | null => {
  const dialect = mapAdapterToDialect(adapter);
  const parserInput = stripJinjaForParser(sql);

  try {
    const cst = parse(parserInput, {
      dialect,
      includeRange: true,
      includeComments: true,
      includeNewlines: true,
      includeSpaces: true,
      filename: filePath,
    });
    return { filePath, content: sql, cst };
  } catch {
    return null;
  }
};

export const walkCst = (cst: unknown, handlers: Record<string, (node: any) => void>): void => {
  const walker = cstVisitor(handlers as never);
  walker(cst as never);
};

export interface CstWalkerNode {
  type?: string;
  range?: [number, number];
  text?: string;
}

export const walkCstWithPath = (
  node: unknown,
  visitor: (current: CstWalkerNode, path: CstWalkerNode[]) => void,
  path: CstWalkerNode[] = [],
): void => {
  if (!node || typeof node !== "object") return;

  const current = node as CstWalkerNode;
  visitor(current, path);
  const nextPath = [...path, current];

  for (const value of Object.values(node as Record<string, unknown>)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        walkCstWithPath(item, visitor, nextPath);
      }
      continue;
    }
    walkCstWithPath(value, visitor, nextPath);
  }
};

export const offsetToLineColumn = (
  sql: string,
  offset: number,
): { line: number; column: number } => {
  const boundedOffset = Math.max(0, Math.min(offset, sql.length));
  const before = sql.slice(0, boundedOffset);
  const line = before.split(/\r?\n/u).length;
  const lastNewline = before.lastIndexOf("\n");
  const column = boundedOffset - lastNewline;
  return { line, column };
};
