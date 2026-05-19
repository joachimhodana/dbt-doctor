/** Max characters per physical line (after trimming trailing whitespace) in model SQL. */
export const DEFAULT_MAX_MODEL_SQL_LINE_LENGTH = 120;

/** Whole name segments (between underscores) treated as discouraged abbreviations. */
export const NAME_ABBREVIATION_DENYLIST = [
  "arch",
  "cust",
  "txn",
  "qty",
  "amt",
  "desc",
  "num",
  "tmp",
  "temp",
  "calc",
  "mgr",
  "admin",
  "addr",
  "org",
  "dept",
  "prod",
  "svc",
] as const;

/** Substrings to find in packages.yml for recommended dbt package dependencies. */
export const RECOMMENDED_DBT_PACKAGE_MARKERS = [
  { id: "dbt_utils", patterns: ["dbt-labs/dbt_utils", "dbt_utils"] },
  { id: "dbt_date", patterns: ["godatadriven/dbt_date", "calogica/dbt_date", "dbt_date"] },
  {
    id: "dbt_expectations",
    patterns: ["metaplane/dbt_expectations", "calogica/dbt_expectations", "dbt_expectations"],
  },
] as const;

export const SEED_DATA_FILE_PATTERN = /\.(csv|tsv|parquet|json)$/i;

export const COLLECTIVE_SCHEMA_YAML_NAMES = new Set([
  "schema.yml",
  "schema.yaml",
  "models.yml",
  "models.yaml",
]);

/** First path segment under models/ treated as a standard dbt layer folder. */
export const CANONICAL_MODEL_LAYER_FOLDERS = new Set([
  "staging",
  "stg",
  "intermediate",
  "int",
  "marts",
  "mart",
  "utilities",
  "util",
]);

export const FOREIGN_KEY_COLUMN_PATTERN = /(^id$|_id$|_key$)/i;

export const PII_COLUMN_NAME_PATTERN =
  /(^|_)(email|e_mail|ssn|social_security|phone|mobile|passport|dob|date_of_birth|birth_date|address|street|zip|postal|ip_address|credit_card|pan)(_|$)/i;

export const HARDCODED_ENV_PATTERN =
  /\b(dev|prod|staging|production|development|test)_[\w]+\b|\b[\w-]+\.(dev|prod|staging|test)\.[\w]+\b/gi;

export const DEFAULT_MAX_CTE_COUNT = 8;

export const LARGE_MODEL_LINE_COUNT = 80;
