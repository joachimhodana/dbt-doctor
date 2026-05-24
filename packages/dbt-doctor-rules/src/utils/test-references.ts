const STRUCTURAL_YAML_KEYS = new Set([
  "columns",
  "config",
  "data_type",
  "description",
  "meta",
  "models",
  "name",
  "quote",
  "tags",
  "tests",
  "version",
]);

export const listTestReferenceNames = (modelBlock: string): string[] => {
  const names: string[] = [];

  for (const line of modelBlock.split(/\r?\n/u)) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;

    // Model/column declarations (`- name: orders`) are not test references.
    if (/^-\s*name\b/i.test(trimmed)) continue;

    const listMatch = trimmed.match(/^-\s+([a-zA-Z0-9_.-]+)(\s*:.*)?$/);
    if (listMatch) {
      const fullName = listMatch[1];
      names.push(fullName.split(".").pop() ?? fullName);
    }

    const inlineList = trimmed.match(/^tests:\s*\[(.+)\]\s*$/);
    if (inlineList) {
      for (const raw of inlineList[1].split(",")) {
        const candidate = raw.trim().replace(/^['"]|['"]$/g, "");
        names.push(candidate.split(".").pop() ?? candidate);
      }
    }

    const mapMatch = trimmed.match(/^([a-zA-Z0-9_.-]+):\s*(\{.*\})?\s*$/);
    if (mapMatch) {
      const fullName = mapMatch[1];
      const key = (fullName.split(".").pop() ?? fullName).toLowerCase();
      if (STRUCTURAL_YAML_KEYS.has(key)) continue;
      names.push(fullName.split(".").pop() ?? fullName);
    }
  }

  return names;
};

export const countTestReferences = (modelBlock: string, testName: string): number =>
  listTestReferenceNames(modelBlock).filter((name) => name === testName).length;

export const singularTestMentionsModel = (sql: string, modelName: string): boolean => {
  const escaped = modelName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\bref\\(\\s*['\"]${escaped}['\"]\\s*\\)`, "i").test(sql);
};
