import path from "node:path";
import type { Rule } from "../types.js";
import { report } from "../utils/report.js";

const MART_PATH_SEGMENTS = ["/marts/", "/mart/", "/fct/", "/dim/"];

export const martsPrefix: Rule = {
  id: "marts-prefix",
  severity: "warn",
  category: "Naming",
  recommendation: "Use fct_ or dim_ prefix for mart models",
  run: ({ sqlFiles }) => {
    const diagnostics = [];
    for (const file of sqlFiles) {
      const relative = file.replace(/\\/g, "/");
      if (!MART_PATH_SEGMENTS.some((segment) => relative.includes(segment))) continue;
      const basename = path.basename(file, path.extname(file));
      if (basename.startsWith("fct_") || basename.startsWith("dim_")) continue;
      diagnostics.push(
        report(
          martsPrefix,
          file,
          `Mart model "${basename}" should use fct_ or dim_ prefix`,
          "Use fct_ for facts and dim_ for dimensions.",
        ),
      );
    }
    return diagnostics;
  },
};
