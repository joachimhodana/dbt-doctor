import type { DbtAdapter } from "@dbt-doctor/types";

const ADAPTER_HINTS: ReadonlyArray<{ pattern: RegExp; adapter: DbtAdapter }> = [
  { pattern: /snowflake/i, adapter: "snowflake" },
  { pattern: /bigquery/i, adapter: "bigquery" },
  { pattern: /postgres|postgresql/i, adapter: "postgres" },
  { pattern: /redshift/i, adapter: "redshift" },
  { pattern: /databricks/i, adapter: "databricks" },
  { pattern: /duckdb/i, adapter: "duckdb" },
  { pattern: /athena/i, adapter: "athena" },
  { pattern: /spark/i, adapter: "spark" },
  { pattern: /trino/i, adapter: "trino" },
];

export const detectAdapterFromProfile = (
  profileName: string | null,
  packagesContent: string | null,
): DbtAdapter => {
  const haystack = `${profileName ?? ""}\n${packagesContent ?? ""}`;
  for (const { pattern, adapter } of ADAPTER_HINTS) {
    if (pattern.test(haystack)) return adapter;
  }
  return "unknown";
};
