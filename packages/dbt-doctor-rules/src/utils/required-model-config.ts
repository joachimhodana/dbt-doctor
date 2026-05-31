import type { RuleContext } from "../types.js";

interface RequiredModelPolicy {
  pathSegments: string[];
  requiredDocs?: boolean;
  requiredTests?: Record<string, number>;
  requiredTags?: string[];
}

type RequirementSection = "models" | "seeds" | "sources";

export interface RequiredModelRequirements {
  requiredDocs?: boolean;
  requiredTests: Record<string, number>;
  requiredTags: string[];
}

const COMMENT_PATTERN = /\s+#.*$/;

const parseBoolean = (value: string): boolean | undefined => {
  const normalized = value.trim().toLowerCase();
  if (["true", "yes", "1", "on"].includes(normalized)) return true;
  if (["false", "no", "0", "off"].includes(normalized)) return false;
  return undefined;
};

const parseInlineTestsMap = (value: string): Record<string, number> => {
  const result: Record<string, number> = {};
  for (const match of value.matchAll(/([a-zA-Z0-9_]+)\s*:\s*(\d+)/g)) {
    result[match[1]] = Number.parseInt(match[2], 10);
  }
  return result;
};

const parseInlineList = (value: string): string[] =>
  value
    .replace(/^\[|\]$/g, "")
    .split(",")
    .map((entry) => entry.trim().replace(/^['"]|['"]$/g, ""))
    .filter((entry) => entry.length > 0);

const parseBlockList = (
  lines: string[],
  startIndex: number,
  parentIndent: number,
): { values: string[]; nextIndex: number } => {
  const values: string[] = [];
  let index = startIndex;

  while (index < lines.length) {
    const rawLine = lines[index] ?? "";
    const uncommented = rawLine.replace(COMMENT_PATTERN, "");
    const trimmed = uncommented.trim();

    if (trimmed.length === 0) {
      index += 1;
      continue;
    }

    const indent = uncommented.match(/^\s*/)?.[0].length ?? 0;
    if (indent <= parentIndent) break;

    const match = trimmed.match(/^-\s+(.+)$/);
    if (match) {
      values.push(match[1].trim().replace(/^['"]|['"]$/g, ""));
    }

    index += 1;
  }

  return { values, nextIndex: index - 1 };
};

const parseBlockTestsMap = (
  lines: string[],
  startIndex: number,
  parentIndent: number,
): { tests: Record<string, number>; nextIndex: number } => {
  const tests: Record<string, number> = {};
  let index = startIndex;

  while (index < lines.length) {
    const rawLine = lines[index] ?? "";
    const uncommented = rawLine.replace(COMMENT_PATTERN, "");
    const trimmed = uncommented.trim();

    if (trimmed.length === 0) {
      index += 1;
      continue;
    }

    const indent = uncommented.match(/^\s*/)?.[0].length ?? 0;
    if (indent <= parentIndent) break;

    const match = trimmed.match(/^([a-zA-Z0-9_]+):\s*(\d+)\s*$/);
    if (match) {
      tests[match[1]] = Number.parseInt(match[2], 10);
    }

    index += 1;
  }

  return { tests, nextIndex: index - 1 };
};

const pathSegmentsForFile = (filePath: string, basePaths: string[]): string[] | null => {
  const normalized = filePath.replace(/\\/g, "/");

  let bestPrefix: string | null = null;
  for (const basePath of basePaths) {
    const prefix = `${basePath.replace(/\\/g, "/")}/`;
    if (!normalized.startsWith(prefix)) continue;
    if (!bestPrefix || prefix.length > bestPrefix.length) {
      bestPrefix = prefix;
    }
  }

  if (!bestPrefix) return null;

  const relative = normalized.slice(bestPrefix.length);
  const parts = relative.split("/");
  if (parts.length <= 1) return [];
  return parts.slice(0, -1);
};

const parseRequiredModelPolicies = (
  content: string,
  projectName: string,
  section: RequirementSection,
): RequiredModelPolicy[] => {
  const lines = content.split(/\r?\n/u);
  const policiesByPath = new Map<string, RequiredModelPolicy>();

  let modelsIndent: number | null = null;
  const stack: Array<{ indent: number; key: string }> = [];

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index] ?? "";
    const uncommented = rawLine.replace(COMMENT_PATTERN, "");
    const trimmed = uncommented.trim();

    if (trimmed.length === 0) continue;

    const indent = uncommented.match(/^\s*/)?.[0].length ?? 0;

    if (modelsIndent === null) {
      if (trimmed === `${section}:`) {
        modelsIndent = indent;
      }
      continue;
    }

    if (indent <= modelsIndent) {
      break;
    }

    const keyValue = trimmed.match(/^([+a-zA-Z0-9_-]+):\s*(.*)$/);
    if (!keyValue) continue;

    const [, key, value = ""] = keyValue;

    while (stack.length > 0 && stack[stack.length - 1]!.indent >= indent) {
      stack.pop();
    }

    if (key.startsWith("+")) {
      const activePath = stack
        .map((entry) => entry.key)
        .filter((segment) => segment !== projectName);
      const pathKey = activePath.join("/");
      const policy =
        policiesByPath.get(pathKey) ??
        (() => {
          const created: RequiredModelPolicy = { pathSegments: activePath };
          policiesByPath.set(pathKey, created);
          return created;
        })();

      if (key === "+required_docs") {
        const parsed = parseBoolean(value);
        if (parsed !== undefined) {
          policy.requiredDocs = parsed;
        }
        continue;
      }

      if (key === "+required_tests") {
        if (value.trim().startsWith("{")) {
          policy.requiredTests = parseInlineTestsMap(value);
          continue;
        }
        if (value.trim().length === 0) {
          const { tests, nextIndex } = parseBlockTestsMap(lines, index + 1, indent);
          policy.requiredTests = tests;
          index = nextIndex;
        }
      }

      if (key === "+required_tags") {
        if (value.trim().startsWith("[")) {
          policy.requiredTags = parseInlineList(value);
          continue;
        }
        if (value.trim().length === 0) {
          const { values, nextIndex } = parseBlockList(lines, index + 1, indent);
          policy.requiredTags = values;
          index = nextIndex;
        }
      }

      continue;
    }

    stack.push({ indent, key });
  }

  return [...policiesByPath.values()].sort(
    (left, right) => left.pathSegments.length - right.pathSegments.length,
  );
};

const hasPrefix = (full: string[], prefix: string[]): boolean =>
  prefix.every((segment, index) => full[index] === segment);

const mergeRequirements = (
  modelSegments: string[],
  policies: RequiredModelPolicy[],
): RequiredModelRequirements => {
  const requiredTests: Record<string, number> = {};
  let requiredTags: string[] = [];
  let requiredDocs: boolean | undefined;

  for (const policy of policies) {
    if (!hasPrefix(modelSegments, policy.pathSegments)) continue;

    if (policy.requiredDocs !== undefined) {
      requiredDocs = policy.requiredDocs;
    }

    if (policy.requiredTests) {
      Object.assign(requiredTests, policy.requiredTests);
    }

    if (policy.requiredTags) {
      requiredTags = [...policy.requiredTags];
    }
  }

  return { requiredDocs, requiredTests, requiredTags };
};

export const resolveModelRequirements = (
  context: RuleContext,
  modelSqlPath: string,
): RequiredModelRequirements => {
  if (!context.fileExists("dbt_project.yml")) {
    return { requiredTests: {}, requiredTags: [] };
  }

  const modelSegments = pathSegmentsForFile(modelSqlPath, context.project.modelPaths);
  if (!modelSegments) {
    return { requiredTests: {}, requiredTags: [] };
  }

  const policies = parseRequiredModelPolicies(
    context.readFile("dbt_project.yml"),
    context.project.projectName,
    "models",
  );

  return mergeRequirements(modelSegments, policies);
};

export const resolveSeedRequirements = (
  context: RuleContext,
  seedFilePath: string,
): RequiredModelRequirements => {
  if (!context.fileExists("dbt_project.yml")) {
    return { requiredTests: {}, requiredTags: [] };
  }

  const seedSegments = pathSegmentsForFile(seedFilePath, context.project.seedPaths);
  if (!seedSegments) {
    return { requiredTests: {}, requiredTags: [] };
  }

  const policies = parseRequiredModelPolicies(
    context.readFile("dbt_project.yml"),
    context.project.projectName,
    "seeds",
  );

  return mergeRequirements(seedSegments, policies);
};

export const resolveSourceRequirements = (
  context: RuleContext,
  sourceYamlPath: string,
): RequiredModelRequirements => {
  if (!context.fileExists("dbt_project.yml")) {
    return { requiredTests: {}, requiredTags: [] };
  }

  const sourceSegments = pathSegmentsForFile(sourceYamlPath, context.project.modelPaths);
  if (!sourceSegments) {
    return { requiredTests: {}, requiredTags: [] };
  }

  const policies = parseRequiredModelPolicies(
    context.readFile("dbt_project.yml"),
    context.project.projectName,
    "sources",
  );

  return mergeRequirements(sourceSegments, policies);
};
