import path from "node:path";

export const normalizePath = (filePath: string): string => filePath.replace(/\\/g, "/");

export const modelBaseName = (sqlPath: string): string =>
  path.basename(sqlPath, path.extname(sqlPath));

export const isModelSqlPath = (filePath: string): boolean => {
  const relative = normalizePath(filePath);
  return (
    (relative.includes("/models/") || relative.startsWith("models/")) && /\.sql$/i.test(relative)
  );
};

export const isUnderModelsYaml = (filePath: string): boolean => {
  const relative = normalizePath(filePath);
  return relative.includes("/models/") || relative.startsWith("models/");
};

export const isSnapshotsYaml = (filePath: string): boolean => {
  const relative = normalizePath(filePath);
  return relative.includes("/snapshots/") || relative.startsWith("snapshots/");
};

export const siblingModelYamlCandidates = (sqlPath: string): string[] => {
  const dir = path.dirname(normalizePath(sqlPath));
  const base = modelBaseName(sqlPath);
  return [`${dir}/${base}.yml`, `${dir}/${base}.yaml`];
};

export const isCollectiveSchemaYaml = (filePath: string): boolean => {
  const base = path.basename(normalizePath(filePath)).toLowerCase();
  return (
    base === "schema.yml" ||
    base === "schema.yaml" ||
    base === "models.yml" ||
    base === "models.yaml"
  );
};
