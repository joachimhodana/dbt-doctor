#!/usr/bin/env node
/**
 * Recomputes coverage % from tool-parity parity tables and sqlfluff-parity.json.
 * Run: node scripts/update-tool-parity-coverage.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const toolParityDir = path.join(repoRoot, "packages/website/docs/tool-parity");
const indexPath = path.join(toolParityDir, "index.md");
const sqlfluffParityPath = path.join(repoRoot, "packages/dbt-doctor-rules/sqlfluff-parity.json");

const TOOL_PAGES = [
  { file: "dbt-project-evaluator.md", label: "dbt_project_evaluator", surface: "29 warehouse fact models" },
  { file: "dbt-meta-testing.md", label: "dbt_meta_testing", surface: "3 config macros" },
  { file: "dbt-checkpoint.md", label: "dbt-checkpoint", surface: "48 lint hooks" },
  { file: "dbt-score.md", label: "dbt-score", surface: "14 generic rules + scoring" },
  { file: "dbt-coverage.md", label: "dbt-coverage", surface: "8 CLI features" },
];

const SQLFLUFF_BUNDLE_TOTAL = 73;

const extractParityMapSection = (markdown) => {
  const start = markdown.indexOf("## Parity map");
  if (start === -1) return markdown;
  const rest = markdown.slice(start + 1);
  const nextHeading = rest.search(/\n## /);
  return nextHeading === -1 ? rest : rest.slice(0, nextHeading);
};

const countParityRows = (markdown) => {
  let covered = 0;
  let partial = 0;
  let notPlanned = 0;

  for (const line of extractParityMapSection(markdown).split("\n")) {
    if (!line.startsWith("|")) continue;
    if (line.includes("| Status |")) continue;
    if (line.includes("| --")) continue;

    if (/\| Covered \|/.test(line)) covered += 1;
    else if (/\| Partial \|/.test(line)) partial += 1;
    else if (/\| Not planned \|/.test(line)) notPlanned += 1;
  }

  const total = covered + partial + notPlanned;
  const weightedPercent =
    total === 0 ? 0 : Math.round(((covered + partial * 0.5) / total) * 10000) / 100;

  return { covered, partial, notPlanned, total, weightedPercent };
};

const replaceCoverageHeader = (markdown, { weightedPercent, covered, partial, notPlanned, total }) => {
  const summary = `**Coverage: ${weightedPercent}%** (${covered} covered, ${partial} partial, ${notPlanned} not planned) of ${total} upstream checks.`;
  return markdown.replace(/\*\*Coverage:[^\n]+\n/, `${summary}\n`);
};

const computeSqlfluffCoverage = () => {
  const parity = JSON.parse(fs.readFileSync(sqlfluffParityPath, "utf8"));
  const tracked = parity.rules.length;
  const trackedCovered = parity.rules.filter((rule) =>
    ["covered-native", "covered-native-with-config"].includes(rule.status),
  ).length;
  const bundlePercent = Math.round((tracked / SQLFLUFF_BUNDLE_TOTAL) * 10000) / 100;
  const trackedPercent = Math.round((trackedCovered / tracked) * 10000) / 100;

  return { tracked, trackedCovered, bundlePercent, trackedPercent };
};

const buildSqlfluffParityTable = (parity) => {
  const lines = [
    "## Native parity map (tracked SQLFluff codes)",
    "",
    "From [`sqlfluff-parity.json`](https://github.com/joachimhodana/dbt-doctor/blob/main/packages/dbt-doctor-rules/sqlfluff-parity.json) (updated " +
      parity.updatedAt +
      ").",
    "",
    "| SQLFluff | Status | dbt-doctor rule(s) |",
    "| -------- | ------ | ------------------ |",
  ];

  for (const entry of parity.rules) {
    const status =
      entry.status === "partial"
        ? "Partial"
        : entry.status.startsWith("covered")
          ? "Covered"
          : "Not planned";
    const rules = entry.dbtDoctorRule
      .split(",")
      .map((rule) => rule.trim())
      .map((rule) => `[\`${rule}\`](/docs/rules#${rule})`)
      .join(", ");
    lines.push(`| \`${entry.sqlfluffRule}\` | ${status} | ${rules} |`);
  }

  return lines.join("\n");
};

const replaceSqlfluffSection = (markdown, parity) => {
  const table = buildSqlfluffParityTable(parity);
  const start = markdown.indexOf("## Native parity map");
  const end = markdown.indexOf("## dbt-specific SQL");
  if (start === -1 || end === -1) return markdown;
  return `${markdown.slice(0, start)}${table}\n\n${markdown.slice(end)}`;
};

const toolSummaries = [];

for (const page of TOOL_PAGES) {
  const filePath = path.join(toolParityDir, page.file);
  let content = fs.readFileSync(filePath, "utf8");
  const counts = countParityRows(content);
  content = replaceCoverageHeader(content, counts);
  fs.writeFileSync(filePath, content);
  toolSummaries.push({ ...page, ...counts });
}

const parity = JSON.parse(fs.readFileSync(sqlfluffParityPath, "utf8"));
const sqlfluff = computeSqlfluffCoverage();
const sqlfluffPath = path.join(toolParityDir, "sqlfluff.md");
let sqlfluffMd = fs.readFileSync(sqlfluffPath, "utf8");

sqlfluffMd = sqlfluffMd.replace(
  /\*\*Coverage:[^\n]+\n/,
  `**Coverage: ${sqlfluff.bundlePercent}%** native (${sqlfluff.tracked} / ${SQLFLUFF_BUNDLE_TOTAL} bundle codes; **${sqlfluff.trackedPercent}%** of tracked layout/style codes). **100%** with \`--use-sqlfluff\`.\n`,
);
sqlfluffMd = replaceSqlfluffSection(sqlfluffMd, parity);
sqlfluffMd = sqlfluffMd.replace(
  /SQLFluff marks ~30 rules as \*\*core\*\*\.[^\n]+\n/,
  `The ${sqlfluff.tracked} tracked codes are the layout, capitalisation, aliasing, and structure rules most teams enable first. Enabling \`--use-sqlfluff\` covers all ${SQLFLUFF_BUNDLE_TOTAL} bundle codes via SQLFluff itself.\n`,
);
fs.writeFileSync(sqlfluffPath, sqlfluffMd);

toolSummaries.push({
  label: "SQLFluff",
  surface: `${SQLFLUFF_BUNDLE_TOTAL} rule codes (stable bundle)`,
  weightedPercent: sqlfluff.bundlePercent,
  note: `${sqlfluff.tracked} native SQL rules; 100% with --use-sqlfluff`,
});

const nativeAverage =
  Math.round(
    (toolSummaries.reduce((acc, tool) => acc + tool.weightedPercent, 0) / toolSummaries.length) * 10,
  ) / 10;

let indexMd = fs.readFileSync(indexPath, "utf8");
indexMd = indexMd.replace(
  /## Overall coverage \([^)]+\)/,
  `## Overall coverage (${parity.updatedAt})`,
);

const tableRows = [
  "| Tool | Upstream surface | Coverage | dbt-doctor rules today |",
  "| ---- | ---------------- | -------: | ---------------------- |",
  `| [dbt_project_evaluator](/docs/tool-parity/dbt-project-evaluator) | 29 warehouse fact models | **${toolSummaries[0].weightedPercent}%** | Manifest DAG rules + file-based architecture |`,
  `| [dbt_meta_testing](/docs/tool-parity/dbt-meta-testing) | 3 config macros | **${toolSummaries[1].weightedPercent}%** | \`required-*-met\` rules (file-based) |`,
  `| [dbt-checkpoint](/docs/tool-parity/dbt-checkpoint) | 48 lint hooks | **${toolSummaries[2].weightedPercent}%** | Configurable meta/tests/contracts |`,
  `| [dbt-score](/docs/tool-parity/dbt-score) | 14 generic rules + scoring | **${toolSummaries[3].weightedPercent}%** | Metadata + snapshot/incremental hygiene |`,
  `| [dbt-coverage](/docs/tool-parity/dbt-coverage) | 8 CLI features | **${toolSummaries[4].weightedPercent}%** | \`--coverage\` (file-based); catalog compare later |`,
  `| [SQLFluff](/docs/tool-parity/sqlfluff) | 73 rule codes (stable bundle) | **${sqlfluff.bundlePercent}%** native; **100%** with \`--use-sqlfluff\` | ${sqlfluff.tracked} native SQL rules + subprocess fallback |`,
];

indexMd = indexMd.replace(
  /\| Tool \| Upstream surface[\s\S]*?\| \[SQLFluff\][^\n]+\n/,
  `${tableRows.join("\n")}\n`,
);

indexMd = indexMd.replace(
  /\*\*Weighted average across the six tools: ~[^*]+\.\*\*[^\n]*/,
  `**Weighted average across the six tools: ~${Math.round(nativeAverage)}%.** With SQLFluff subprocess enabled, SQL style is 100% for teams that keep Python in CI.`,
);

fs.writeFileSync(indexPath, indexMd);

console.log("Updated tool-parity coverage:");
for (const tool of toolSummaries) {
  console.log(`  ${tool.label}: ${tool.weightedPercent}%`);
}
console.log(`  Overall average: ~${Math.round(nativeAverage)}%`);
