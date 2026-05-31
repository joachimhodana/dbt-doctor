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
  sqlfluffCode: string;
}

const CASES: CompatibilityCase[] = [
  {
    name: "keyword casing",
    filePath: "models/staging/stg_keyword_case.sql",
    sql: "select id FROM raw_orders\n",
    nativeRule: "sql-keywords-case",
    sqlfluffCode: "CP01",
  },
  {
    name: "operator spacing",
    filePath: "models/staging/stg_operator_spacing.sql",
    sql: "select id+1 as id2 from raw_orders\n",
    nativeRule: "sql-operator-spacing",
    sqlfluffCode: "LT03",
  },
  {
    name: "function spacing",
    filePath: "models/staging/stg_function_spacing.sql",
    sql: "select count (*) as c from raw_orders\n",
    nativeRule: "sql-function-spacing",
    sqlfluffCode: "LT06",
  },
];

describe("sqlfluff compatibility", () => {
  let directory = "";

  afterEach(() => {
    if (directory) fs.rmSync(directory, { recursive: true, force: true });
  });

  it("matches representative SQLFluff code families for native rules", async () => {
    if (!(await isSqlfluffAvailable())) return;

    directory = fs.mkdtempSync(path.join(os.tmpdir(), "dbt-doctor-sqlfluff-compat-"));
    writeFile(
      directory,
      "dbt_project.yml",
      'name: sqlfluff_compat\nversion: "1"\nprofile: default\nmodel-paths: ["models"]\n',
    );

    for (const item of CASES) writeFile(directory, item.filePath, item.sql);
    const project = discoverProject(directory);

    for (const item of CASES) {
      const native = await runLinter({
        rootDirectory: directory,
        project,
        includePaths: [item.filePath],
        ignoredTags: new Set(),
        useSqlfluff: false,
      });
      const sqlfluff = await runLinter({
        rootDirectory: directory,
        project,
        includePaths: [item.filePath],
        ignoredTags: new Set(),
        useSqlfluff: true,
      });

      expect(native.some((diagnostic) => diagnostic.rule === item.nativeRule)).toBe(true);
      expect(
        sqlfluff.some(
          (diagnostic) => diagnostic.plugin === "sqlfluff" && diagnostic.rule === item.sqlfluffCode,
        ),
      ).toBe(true);
    }
  });
});
