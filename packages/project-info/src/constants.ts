export const SOURCE_FILE_PATTERN = /\.sql$/;

export const YAML_SOURCE_PATTERN = /\.(yml|yaml)$/;

export const DBT_PROJECT_FILENAME = "dbt_project.yml";

export const GIT_LS_FILES_MAX_BUFFER_BYTES = 50 * 1024 * 1024;

export const IGNORED_DIRECTORIES = new Set([
  ".git",
  ".turbo",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "target",
  "dbt_packages",
  "logs",
  "out",
]);
