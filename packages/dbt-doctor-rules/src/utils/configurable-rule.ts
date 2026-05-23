export const parseStringList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string" && entry.length > 0);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }
  return [];
};

export const toSnakeCase = (value: string): string =>
  value.replace(/[A-Z]/g, (ch) => `_${ch.toLowerCase()}`);

const toPositiveInteger = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    const count = Math.floor(value);
    return count >= 1 ? count : null;
  }
  if (typeof value === "string" && /^\d+$/u.test(value.trim())) {
    const count = Number.parseInt(value.trim(), 10);
    return count >= 1 ? count : null;
  }
  return null;
};

export const parsePositiveCountMap = (
  raw: Record<string, unknown>,
  allowedKeys?: ReadonlySet<string>,
): Record<string, number> => {
  const parsed: Record<string, number> = {};

  for (const [key, value] of Object.entries(raw)) {
    const normalizedKey = toSnakeCase(key.trim());
    if (allowedKeys && !allowedKeys.has(normalizedKey)) continue;

    const count = toPositiveInteger(value);
    if (count === null) continue;
    parsed[normalizedKey] = count;
  }

  return parsed;
};

export const extractTags = (block: string): Set<string> => {
  const tags = new Set<string>();

  const inline = block.match(/\btags:\s*\[([^\]]+)\]/i)?.[1];
  if (inline) {
    for (const raw of inline.split(",")) {
      const normalized = raw.trim().replace(/^['"]|['"]$/g, "");
      if (normalized.length > 0) tags.add(normalized);
    }
  }

  const list = block.match(/\btags:\s*\n([\s\S]*?)(\n\s*[a-zA-Z_][\w-]*:|$)/i)?.[1] ?? "";
  for (const match of list.matchAll(/^\s*-\s+(.+)$/gm)) {
    const normalized = match[1].trim().replace(/^['"]|['"]$/g, "");
    if (normalized.length > 0) tags.add(normalized);
  }

  return tags;
};

export const blockHasMetaKey = (block: string, key: string): boolean => {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\bmeta:\\s*\\n[\\s\\S]*?\\b${escaped}:\\s*\\S`, "i").test(block);
};
