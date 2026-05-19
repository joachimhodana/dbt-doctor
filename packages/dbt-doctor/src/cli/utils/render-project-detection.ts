import type { ProjectInfo, DbtDoctorConfig } from "@dbt-doctor/types";
import { formatFrameworkName } from "@dbt-doctor/project-info";
import { highlighter, logger } from "@dbt-doctor/core";
import { spinner } from "./spinner.js";

export const printProjectDetection = (
  projectInfo: ProjectInfo,
  userConfig: DbtDoctorConfig | null,
  isDiffMode: boolean,
  includePaths: string[],
  lintSourceFileCount?: number,
): void => {
  const completeStep = (message: string) => {
    spinner(message).start().succeed(message);
  };

  completeStep(`Detecting dbt project. Found ${highlighter.info(projectInfo.projectName)}.`);
  completeStep(
    `Detecting adapter. Found ${highlighter.info(formatFrameworkName(projectInfo.adapter))}.`,
  );
  completeStep(
    `Detecting dbt version. ${
      projectInfo.dbtVersion
        ? `Found ${highlighter.info(`dbt ${projectInfo.dbtVersion}`)}.`
        : "Not found in requirements."
    }`,
  );

  if (isDiffMode) {
    completeStep(`Scanning ${highlighter.info(`${includePaths.length}`)} changed source files.`);
  } else {
    completeStep(
      `Found ${highlighter.info(`${lintSourceFileCount ?? projectInfo.sourceFileCount}`)} SQL files.`,
    );
  }

  if (userConfig) {
    completeStep(`Loaded ${highlighter.info("dbt-doctor config")}.`);
  }

  logger.break();
};
