export type DbtAdapter =
  | "snowflake"
  | "bigquery"
  | "postgres"
  | "redshift"
  | "databricks"
  | "duckdb"
  | "athena"
  | "spark"
  | "trino"
  | "unknown";

export interface ProjectInfo {
  rootDirectory: string;
  projectName: string;
  dbtVersion: string | null;
  adapter: DbtAdapter;
  profileName: string | null;
  modelPaths: string[];
  macroPaths: string[];
  testPaths: string[];
  seedPaths: string[];
  snapshotPaths: string[];
  analysisPaths: string[];
  sourceFileCount: number;
}

export interface WorkspacePackage {
  name: string;
  directory: string;
}

export interface PackageJson {
  name?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  workspaces?: string[] | { packages?: string[] };
}
