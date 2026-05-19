/** Path helpers aligned with dbt Labs project structure guidance. */

export const normalizeModelPath = (filePath: string): string => filePath.replace(/\\/g, "/");

export const isStagingModelPath = (filePath: string): boolean => {
  const relative = normalizeModelPath(filePath);
  return (
    /\/(staging|stg)\//.test(relative) ||
    /\/stg_[^/]+\.sql$/.test(relative) ||
    /^models\/stg_/.test(relative)
  );
};

export const isIntermediateModelPath = (filePath: string): boolean => {
  const relative = normalizeModelPath(filePath);
  return (
    /\/(intermediate|int)\//.test(relative) ||
    /\/int_[^/]+\.sql$/.test(relative) ||
    /^models\/int_/.test(relative)
  );
};

export const isMartModelPath = (filePath: string): boolean => {
  const relative = normalizeModelPath(filePath);
  return (
    /\/(marts|mart)\//.test(relative) ||
    /\/(fct|dim)_[^/]+\.sql$/.test(relative) ||
    /^models\/(fct|dim)_/.test(relative)
  );
};

/** Marts or intermediate — should not call {{ source() }} directly. */
export const isDownstreamModelPath = (filePath: string): boolean =>
  isIntermediateModelPath(filePath) || isMartModelPath(filePath);

export const isModelsRootSqlFile = (filePath: string): boolean =>
  /^models\/[^/]+\.sql$/i.test(normalizeModelPath(filePath));

export const modelLayerFolder = (filePath: string): string | null => {
  const relative = normalizeModelPath(filePath);
  const match = relative.match(/^models\/([^/]+)\//);
  return match?.[1]?.toLowerCase() ?? null;
};
