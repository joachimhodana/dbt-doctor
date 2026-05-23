export type SqlCasePolicy = "consistent" | "upper" | "lower";

export const resolveSqlCasePolicy = (
  ruleConfig: Record<string, unknown>,
  fallback: SqlCasePolicy = "consistent",
): SqlCasePolicy => {
  const raw = ruleConfig.capitalisationPolicy;
  if (raw === "upper" || raw === "lower" || raw === "consistent") return raw;
  return fallback;
};

export const isUpperCase = (value: string): boolean => value === value.toUpperCase();
export const isLowerCase = (value: string): boolean => value === value.toLowerCase();

export const matchesSqlCasePolicy = (value: string, policy: Exclude<SqlCasePolicy, "consistent">): boolean =>
  policy === "upper" ? isUpperCase(value) : isLowerCase(value);
