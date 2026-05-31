/** Split top-level list items under a YAML key (models, macros, seeds) at two-space indent. */
export const splitNamedYamlBlocks = (
  content: string,
  listKey: string,
): { name: string; block: string }[] => {
  const header = content.match(new RegExp(`^\\s*${listKey}:\\s*\\n`, "m"));
  if (!header || header.index === undefined) return [];

  const tail = content.slice(header.index + header[0].length);
  const itemRegex = /^\s{2}-\s+name:\s+["']?([\w.-]+)/gm;
  const indices: { name: string; index: number }[] = [];

  for (const match of tail.matchAll(itemRegex)) {
    if (match.index !== undefined) indices.push({ name: match[1], index: match.index });
  }

  return indices.map(({ name, index }, i) => {
    const end = i + 1 < indices.length ? indices[i + 1].index : tail.length;
    return { name, block: tail.slice(index, end) };
  });
};

export const blockHasDescription = (block: string): boolean =>
  /description:\s*\S/.test(block.split("columns:")[0] ?? block);

export const blockHasContractEnforced = (block: string): boolean =>
  /contract:\s*\n\s*enforced:\s*true/i.test(block) ||
  /contract:\s*\{[^}]*enforced:\s*true/i.test(block) ||
  /contract:\s*enforced:\s*true/i.test(block);

export const splitColumnBlocks = (modelBlock: string): { name: string; block: string }[] => {
  const columnsIndex = modelBlock.search(/\n\s*columns:\s*\n/);
  if (columnsIndex < 0) return [];
  const tail = modelBlock.slice(columnsIndex);
  const results: { name: string; block: string }[] = [];
  for (const part of tail.split(/\n\s+-\s+name:\s+/).slice(1)) {
    const name = part.match(/^["']?([\w.-]+)/)?.[1];
    if (!name) continue;
    results.push({ name, block: part });
  }
  return results;
};

export const blockHasTest = (block: string, testName: string): boolean =>
  new RegExp(`-\\s+${testName}\\b`).test(block) || new RegExp(`-\\s+${testName}:`).test(block);

export const blockHasRelationshipTest = (block: string): boolean =>
  /relationships:/.test(block) || /dbt_expectations\./.test(block);

export const blockHasMetaOwner = (block: string): boolean =>
  /meta:\s*\n[\s\S]*?\bowner:/.test(block) || /\bowner:\s*\S/.test(block);

export const blockHasClusterBy = (block: string): boolean => /cluster_by:/.test(block);

export const findModelBlock = (
  modelName: string,
  yamlFiles: string[],
  readFile: (path: string) => string,
  isYamlPath: (path: string) => boolean,
): { file: string; block: string } | null => {
  for (const file of yamlFiles) {
    if (!isYamlPath(file)) continue;
    for (const block of splitNamedYamlBlocks(readFile(file), "models")) {
      if (block.name === modelName) return { file, block: block.block };
    }
  }
  return null;
};

const isSeedYamlPath = (filePath: string): boolean => {
  const relative = filePath.replace(/\\/g, "/");
  return relative.includes("/seeds/") || relative.startsWith("seeds/") || relative === "seeds";
};

export const findSeedBlock = (
  seedName: string,
  yamlFiles: string[],
  readFile: (path: string) => string,
): { file: string; block: string } | null => {
  for (const file of yamlFiles) {
    if (!isSeedYamlPath(file)) continue;
    if (!/\.(yml|yaml)$/i.test(file)) continue;
    for (const block of splitNamedYamlBlocks(readFile(file), "seeds")) {
      if (block.name === seedName) return { file, block: block.block };
    }
  }
  return null;
};

export interface SourceTableBlock {
  sourceName: string;
  tableName: string;
  block: string;
}

export const splitSourceTableBlocks = (content: string): SourceTableBlock[] => {
  const tables: SourceTableBlock[] = [];

  for (const source of splitNamedYamlBlocks(content, "sources")) {
    const tablesIndex = source.block.search(/\n\s*tables:\s*\n/);
    if (tablesIndex < 0) continue;

    const tablesTail = source.block.slice(tablesIndex);
    const tableRegex = /^\s{6}-\s+name:\s+["']?([\w.-]+)/gm;
    const indices: { tableName: string; index: number }[] = [];
    for (const match of tablesTail.matchAll(tableRegex)) {
      if (match.index === undefined) continue;
      indices.push({ tableName: match[1], index: match.index });
    }

    for (let index = 0; index < indices.length; index += 1) {
      const start = indices[index]!.index;
      const end = index + 1 < indices.length ? indices[index + 1]!.index : tablesTail.length;
      const block = tablesTail.slice(start, end);
      tables.push({
        sourceName: source.name,
        tableName: indices[index]!.tableName,
        block,
      });
    }
  }

  return tables;
};
