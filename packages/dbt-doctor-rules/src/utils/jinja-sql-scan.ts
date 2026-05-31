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

const JINJA_ONLY_TARGET_PATTERN = /^\{\{[\s\S]*\}\}$/;

export const findJinjaRanges = (content: string): TextRange[] => {
  const ranges: TextRange[] = [];
  for (const match of content.matchAll(JINJA_BLOCK_PATTERN)) {
    if (match.index === undefined) continue;
    ranges.push({ start: match.index, end: match.index + match[0].length });
  }
  return ranges;
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

export const isJinjaQualifier = (qualifier: string): boolean =>
  JINJA_QUALIFIERS.has(qualifier.toLowerCase());

export const isDbtMacroSelectTarget = (target: string): boolean => {
  const trimmed = target.trim();
  if (JINJA_ONLY_TARGET_PATTERN.test(trimmed)) return true;
  if (DBT_COLUMN_MACRO_PATTERN.test(trimmed)) return true;
  return false;
};

export const hasUnionByName = (content: string): boolean => /\bunion\s+by\s+name\b/i.test(content);
