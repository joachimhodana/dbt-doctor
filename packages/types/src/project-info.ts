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

/** Host framework hints from package.json (legacy project-info helpers). */
export type Framework =
  | "nextjs"
  | "tanstack-start"
  | "vite"
  | "cra"
  | "remix"
  | "gatsby"
  | "expo"
  | "react-native"
  | "unknown";

export interface DependencyInfo {
  reactVersion: string | null;
  tailwindVersion: string | null;
  framework: Framework;
}

/** `workspaces` object form (npm / Yarn / pnpm) with optional inline catalogs. */
export interface PackageJsonWorkspacesConfig {
  packages?: string[];
  catalog?: Record<string, unknown>;
  catalogs?: Record<string, Record<string, unknown>>;
}

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
  optionalDependencies?: Record<string, string>;
  /** Inline default catalog (pnpm package.json). */
  catalog?: Record<string, unknown>;
  /** Named catalog groups (pnpm package.json). */
  catalogs?: Record<string, Record<string, unknown>>;
  workspaces?: string[] | PackageJsonWorkspacesConfig;
}
