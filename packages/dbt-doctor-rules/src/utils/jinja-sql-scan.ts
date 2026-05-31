export interface TextRange {
  start: number;
  end: number;
}

export const JINJA_BLOCK_PATTERN = /\{\{[\s\S]*?\}\}|\{%[\s\S]*?%\}|\{#[\s\S]*?#\}/g;

const JINJA_QUALIFIERS = new Set([
  "model",
  "this",
  "target",
  "var",
  "env_var",
  "config",
  "ref",
  "source",
  "adapter",
  "dbt",
  "return",
]);

const DBT_COLUMN_MACRO_PATTERN =
  /\b(?:trim_all_columns|star|dbt_utils\.star|generate_surrogate_key|dbt\.star)\s*\(/i;

const JINJA_ONLY_TARGET_PATTERN = /^\{\{[\s\S]*\}\}(\.\*+)?$/;

const JINJA_CONTROL_BLOCK_PATTERN =
  /\{%-?\s*(if|for|macro|block|call)\b[\s\S]*?-?%\}[\s\S]*?\{%-?\s*end\1\b[\s\S]*?-?%\}/gi;

const mergeRanges = (ranges: TextRange[]): TextRange[] => {
  if (ranges.length === 0) return ranges;
  const sorted = [...ranges].sort((left, right) => left.start - right.start);
  const merged: TextRange[] = [sorted[0]!];
  for (const range of sorted.slice(1)) {
    const last = merged[merged.length - 1]!;
    if (range.start <= last.end) {
      last.end = Math.max(last.end, range.end);
      continue;
    }
    merged.push(range);
  }
  return merged;
};

export const findJinjaRanges = (content: string): TextRange[] => {
  const ranges: TextRange[] = [];
  for (const match of content.matchAll(JINJA_BLOCK_PATTERN)) {
    if (match.index === undefined) continue;
    ranges.push({ start: match.index, end: match.index + match[0].length });
  }
  for (const match of content.matchAll(JINJA_CONTROL_BLOCK_PATTERN)) {
    if (match.index === undefined) continue;
    ranges.push({ start: match.index, end: match.index + match[0].length });
  }
  return mergeRanges(ranges);
};

export const isInsideRanges = (offset: number, ranges: TextRange[]): boolean =>
  ranges.some((range) => offset >= range.start && offset < range.end);

export const maskJinjaBlocks = (content: string): string => {
  const ranges = findJinjaRanges(content);
  if (ranges.length === 0) return content;

  let masked = content;
  for (const range of ranges) {
    const length = range.end - range.start;
    masked =
      masked.slice(0, range.start) +
      " ".repeat(length) +
      masked.slice(range.end);
  }
  return masked;
};

export const stripLineComments = (line: string): string =>
  line.replace(/--.*$/u, "").replace(/\/\*[\s\S]*?\*\//gu, "");

export const stripSqlComments = (content: string): string => {
  const withoutBlockComments = content.replace(/\/\*[\s\S]*?\*\//g, (comment) =>
    " ".repeat(comment.length),
  );
  return withoutBlockComments
    .split("\n")
    .map((line) => stripLineComments(line))
    .join("\n");
};

const SQL_ALIAS_STOP_WORDS = new Set([
  "select",
  "from",
  "where",
  "join",
  "left",
  "right",
  "inner",
  "outer",
  "full",
  "cross",
  "group",
  "order",
  "having",
  "on",
  "and",
  "or",
  "case",
  "when",
  "then",
  "else",
  "end",
  "union",
  "all",
  "as",
  "by",
  "limit",
  "offset",
  "qualify",
  "window",
  "into",
  "set",
  "values",
  "returning",
  "using",
  "natural",
  "lateral",
  "table",
  "with",
  "distinct",
  "top",
]);

export const isSqlAliasStopWord = (word: string): boolean =>
  SQL_ALIAS_STOP_WORDS.has(word.toLowerCase());

const addAlias = (aliases: Set<string>, candidate: string | undefined): void => {
  const normalized = (candidate ?? "").trim().replace(/[,;]$/, "");
  if (!normalized) return;
  if (!/^[a-zA-Z_][\w$]*$/.test(normalized)) return;
  if (isSqlAliasStopWord(normalized)) return;
  aliases.add(normalized.toLowerCase());
};

const extractAliasFromClause = (clause: string): string | null => {
  const trimmed = clause.trim();
  if (!trimmed) return null;

  const beforeOn = trimmed.split(/\bon\b/i)[0]?.trim() ?? trimmed;
  const tokens = beforeOn.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return null;

  let alias = tokens[tokens.length - 1]!;
  if (alias.toLowerCase() === "as" && tokens.length >= 2) {
    alias = tokens[tokens.length - 2]!;
  }

  if (isSqlAliasStopWord(alias)) return null;
  if (!/^[a-zA-Z_][\w$]*$/.test(alias)) return null;
  return alias.toLowerCase();
};

/** Table aliases declared in FROM/JOIN, subqueries, and CTE headers. */
export const collectTableAliases = (content: string): Set<string> => {
  const aliases = new Set<string>();
  const scrubbed = stripSqlComments(maskJinjaBlocks(content));
  const FROM_JOIN = /\b(?:from|join)\s+(?!\()/gi;

  for (const line of scrubbed.split("\n")) {
    const trimmed = stripLineComments(line);
    for (const match of trimmed.matchAll(FROM_JOIN)) {
      if (match.index === undefined) continue;
      const alias = extractAliasFromClause(trimmed.slice(match.index + match[0].length));
      if (alias) addAlias(aliases, alias);
    }
  }

  for (const match of scrubbed.matchAll(/\b([a-zA-Z_][\w$]*)\s+as\s*\(/gi)) {
    addAlias(aliases, match[1]);
  }

  for (const match of scrubbed.matchAll(/\)\s+(?:as\s+)?([a-zA-Z_][\w$]*)\b(?=\s+on\b)/gi)) {
    addAlias(aliases, match[1]);
  }

  const lines = scrubbed.split("\n");
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const trimmed = stripLineComments(lines[lineIndex]!);
    if (!/^\s*(?:left|right|inner|outer|full|cross|natural)?\s*join\s*$/i.test(trimmed)) {
      continue;
    }

    for (let nextIndex = lineIndex + 1; nextIndex < lines.length; nextIndex += 1) {
      const nextLine = stripLineComments(lines[nextIndex]!);
      if (!nextLine.trim()) continue;
      if (/^\s*on\b/i.test(nextLine)) break;

      const alias = extractAliasFromClause(nextLine.split(/\bon\b/i)[0] ?? nextLine);
      if (alias) addAlias(aliases, alias);
      if (/\bon\b/i.test(nextLine)) break;
      break;
    }
  }

  return aliases;
};

export const isJinjaQualifier = (qualifier: string): boolean =>
  JINJA_QUALIFIERS.has(qualifier.toLowerCase());

export const isDbtMacroSelectTarget = (target: string): boolean => {
  const trimmed = target.trim();
  if (JINJA_ONLY_TARGET_PATTERN.test(trimmed)) return true;
  if (DBT_COLUMN_MACRO_PATTERN.test(trimmed)) return true;
  return false;
};

export const isOffsetInSqlComment = (content: string, offset: number): boolean => {
  const lineStart = content.lastIndexOf("\n", offset - 1) + 1;
  const lineEnd = content.indexOf("\n", offset);
  const line = content.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);
  if (stripLineComments(line).trim().length === 0) return true;

  const beforeOffset = line.slice(0, offset - lineStart);
  return /--/.test(beforeOffset) || /\/\*/.test(beforeOffset);
};

export const hasUnionByName = (content: string): boolean => /\bunion\s+by\s+name\b/i.test(content);
