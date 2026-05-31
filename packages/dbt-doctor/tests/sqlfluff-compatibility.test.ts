import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { isSqlfluffAvailable, runLinter } from "@dbt-doctor/core";
import { discoverProject } from "@dbt-doctor/project-info";

const writeFile = (rootDir: string, relativePath: string, body: string): void => {
  const filePath = path.join(rootDir, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, body);
};

interface CompatibilityCase {
  name: string;
  filePath: string;
  sql: string;
  nativeRule: string;
  /** SQLFluff rule codes that fire with default ansi dialect (verified in CI). */
  sqlfluffCodes: string[];
}

/**
 * Pairs where native rules and SQLFluff both flag the same SQL under `--dialect ansi`.
 * Other parity rules are covered by dedicated sql-* test suites without subprocess coupling.
 */
const CASES: CompatibilityCase[] = [
  {
    name: "keyword casing",
    filePath: "models/staging/stg_keyword_case.sql",
    sql: "select id FROM raw_orders\n",
    nativeRule: "sql-keywords-case",
    sqlfluffCodes: ["CP01"],
  },
  {
    name: "function spacing",
    filePath: "models/staging/stg_function_spacing.sql",
    sql: "select count (*) as c from raw_orders\n",
    nativeRule: "sql-function-spacing",
    sqlfluffCodes: ["LT06"],
  },
  {
    name: "count star preferred",
    filePath: "models/staging/stg_count_one.sql",
    sql: "select count(1) as c from raw_orders\n",
    nativeRule: "sql-count-star-preferred",
    sqlfluffCodes: ["CV04"],
  },
  {
    name: "distinct parentheses",
    filePath: "models/staging/stg_distinct_parentheses.sql",
    sql: "select distinct(id) from raw_orders\n",
    nativeRule: "sql-distinct-parentheses",
    sqlfluffCodes: ["ST08"],
  },
  {
    name: "consecutive semicolons",
    filePath: "models/staging/stg_consecutive_semicolons.sql",
    sql: "select 1;;\n",
    nativeRule: "sql-no-consecutive-semicolons",
    sqlfluffCodes: ["ST12"],
  },
  {
    name: "derived table alias required",
    filePath: "models/staging/stg_derived_no_alias.sql",
    sql: "select * from (select 1 as id)\n",
    nativeRule: "sql-derived-table-alias-required",
    sqlfluffCodes: ["AL10"],
  },
  {
    name: "ambiguous join type",
    filePath: "models/staging/stg_ambiguous_join_type.sql",
    sql: "select *\nfrom a\njoin b on a.id = b.id\n",
    nativeRule: "sql-ambiguous-join-type",
    sqlfluffCodes: ["AM05"],
  },
];

describe("sqlfluff compatibility", () => {
  let directory = "";

  afterEach(() => {
    if (directory) fs.rmSync(directory, { recursive: true, force: true });
  });

  it("matches SQLFluff code families for native rules when subprocess is available", async () => {
    if (!(await isSqlfluffAvailable())) return;

    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-sqlfluff-compat-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: sqlfluff_compat\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );

    for (const item of CASES) writeFile(directory, item.filePath, item.sql);
    const project = discoverProject(directory);

    const includePaths = CASES.map((item) => item.filePath);
    const native = await runLinter({
      rootDirectory: directory,
      project,
      includePaths,
      ignoredTags: new Set(),
      useSqlfluff: false,
    });
    const sqlfluff = await runLinter({
      rootDirectory: directory,
      project,
      includePaths,
      ignoredTags: new Set(),
      useSqlfluff: true,
    });

    for (const item of CASES) {
      const nativeFileDiagnostics = native.filter(
        (diagnostic) => diagnostic.filePath === item.filePath,
      );
      const sqlfluffFileDiagnostics = sqlfluff.filter(
        (diagnostic) => diagnostic.filePath === item.filePath && diagnostic.plugin === "sqlfluff",
      );
      expect(
        nativeFileDiagnostics.some((diagnostic) => diagnostic.rule === item.nativeRule),
        `${item.name}: expected native rule ${item.nativeRule}`,
      ).toBe(true);
      expect(
        sqlfluffFileDiagnostics.some((diagnostic) => item.sqlfluffCodes.includes(diagnostic.rule)),
        `${item.name}: expected one of SQLFluff codes ${item.sqlfluffCodes.join(", ")}; got ${sqlfluffFileDiagnostics.map((d) => d.rule).join(", ") || "none"}`,
      ).toBe(true);
    }
  });
});
