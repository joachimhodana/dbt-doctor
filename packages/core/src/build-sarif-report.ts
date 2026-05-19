import type { Diagnostic } from "@dbt-doctor/types";

export const buildSarifReport = (diagnostics: Diagnostic[], toolVersion: string) => {
  const ruleIds = [...new Set(diagnostics.map((d) => `${d.plugin}/${d.rule}`))];
  return {
    version: "2.1.0" as const,
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    runs: [
      {
        tool: {
          driver: {
            name: "dbt-doctor",
            version: toolVersion,
            rules: ruleIds.map((id) => ({ id, shortDescription: { text: id } })),
          },
        },
        results: diagnostics.map((diagnostic) => ({
          ruleId: `${diagnostic.plugin}/${diagnostic.rule}`,
          level: diagnostic.severity === "error" ? ("error" as const) : ("warning" as const),
          message: { text: `${diagnostic.message} — ${diagnostic.help}` },
          locations: [
            {
              physicalLocation: {
                artifactLocation: { uri: diagnostic.filePath },
                region: {
                  startLine: Math.max(1, diagnostic.line),
                  startColumn: Math.max(1, diagnostic.column),
                },
              },
            },
          ],
        })),
      },
    ],
  };
};
