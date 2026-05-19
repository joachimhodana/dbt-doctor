import type { Rule } from "../types.js";
import { report } from "../utils/report.js";

export const emptyModelFile: Rule = {
  id: "empty-model-file",
  severity: "error",
  category: "SQL Quality",
  run: ({ sqlFiles, readFile }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      if (readFile(file).trim().length > 0) continue;
      diagnostics.push(
        report(
          emptyModelFile,
          file,
          "Model SQL file is empty",
          "Add model SQL or remove the unused file.",
        ),
      );
    }
    return diagnostics;
  },
};
