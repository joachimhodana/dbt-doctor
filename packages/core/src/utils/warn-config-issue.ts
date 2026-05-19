export const warnConfigIssue = (message: string): void => {
  process.stderr.write(`[dbt-doctor] ${message}\n`);
};
