import { afterEach, describe, expect, it } from "vite-plus/test";
import { runCustomRules } from "dbt-doctor-rules";
import { discoverProject } from "@dbt-doctor/project-info";
import { DBT_FP_GUARDRAILS } from "./fixtures/dbt-fp-guardrails.js";
import { createTempDbtProject, type TempDbtProject } from "./helpers/temp-dbt-project.js";

const runRules = (directory: string, ruleIds: string[]) =>
  runCustomRules({
    rootDirectory: directory,
    project: discoverProject(directory),
    ignoredTags: new Set(),
  }).filter((diagnostic) => ruleIds.includes(diagnostic.rule));

describe("dbt false-positive guardrails", () => {
  let project: TempDbtProject | undefined;

  afterEach(() => {
    project?.cleanup();
    project = undefined;
  });

  it.each(DBT_FP_GUARDRAILS)("$id — $label", (guardrail) => {
    project = createTempDbtProject({
      modelSql: guardrail.modelSql,
      modelPath: guardrail.modelPath,
      extraFiles: guardrail.extraFiles,
    });

    const diagnostics = runRules(project.directory, guardrail.rules);
    expect(
      diagnostics,
      diagnostics
        .map((diagnostic) => `${diagnostic.rule} @ ${diagnostic.filePath}:${diagnostic.line}`)
        .join("\n"),
    ).toHaveLength(0);
  });
});
