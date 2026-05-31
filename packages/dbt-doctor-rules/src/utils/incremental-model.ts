/** True when the model is configured as incremental (SQL config() or YAML). */
export const isIncrementalModel = (sql: string, yamlBlock: string | null): boolean => {
  if (/materialized\s*=\s*['"]incremental['"]/i.test(sql)) return true;
  if (/materialized:\s*incremental/i.test(yamlBlock ?? "")) return true;
  if (/materialized:\s*['"]incremental['"]/i.test(yamlBlock ?? "")) return true;
  return false;
};
