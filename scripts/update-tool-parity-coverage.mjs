#!/usr/bin/env node
/**
 * Recompute coverage numbers from tool parity markdown tables.
 * This script intentionally does not rewrite parity tables/content.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const toolParityDir = path.join(repoRoot, "packages/website/docs/tool-parity");
const indexPath = path.join(toolParityDir, "index.md");

const TOOL_FILES = [
  { file: "dbt-meta-testing.md", label: "dbt_meta_testing" },
  { file: "dbt-checkpoint.md", label: "dbt-checkpoint" },
  { file: "dbt-score.md", label: "dbt-score" },
  { file: "dbt-coverage.md", label: "dbt-coverage" },
  { file: "sqlfluff.md", label: "SQLFluff" },
];

const extractParityMapSection = (markdown) => {
  const start = markdown.indexOf("## Parity map");
  if (start === -1) return "";
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
    if (line.includes("| ---")) continue;

    if (/\| Covered \|/.test(line)) covered += 1;
    else if (/\| Partial \|/.test(line)) partial += 1;
    else if (/\| Not planned \|/.test(line)) notPlanned += 1;
  }

  const total = covered + partial + notPlanned;
  const weightedPercent =
    total === 0 ? 0 : Math.round(((covered + partial * 0.5) / total) * 10000) / 100;

  return { covered, partial, notPlanned, total, weightedPercent };
};

const replaceCoverageHeader = (markdown, counts) => {
  const summary = `**Coverage: ${counts.weightedPercent}%** (${counts.covered} covered, ${counts.partial} partial, ${counts.notPlanned} not planned) of ${counts.total} upstream checks.`;
  return markdown.replace(/\*\*Coverage:[^\n]*\*\*[^\n]*\n/, `${summary}\n`);
};

const patchIndexRowCoverage = (markdown, label, percent) =>
  markdown.replace(
    new RegExp(
      `(\\| \\[${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\]\\([^\\n]+\\| \\*\\*)([^*]+)(\\*\\*[^\\n]*\\|)`,
    ),
    `$1${percent}%$3`,
  );

const toHumanDate = (date) =>
  date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

const toolSummaries = [];

for (const { file, label } of TOOL_FILES) {
  const filePath = path.join(toolParityDir, file);
  if (!fs.existsSync(filePath)) continue;
  const original = fs.readFileSync(filePath, "utf8");
  const counts = countParityRows(original);
  const patched = replaceCoverageHeader(original, counts);
  fs.writeFileSync(filePath, patched);
  toolSummaries.push({ label, ...counts });
}

let indexMd = fs.readFileSync(indexPath, "utf8");
for (const summary of toolSummaries) {
  indexMd = patchIndexRowCoverage(indexMd, summary.label, summary.weightedPercent);
}

const average =
  toolSummaries.length === 0
    ? 0
    : Math.round(
        (toolSummaries.reduce((acc, summary) => acc + summary.weightedPercent, 0) /
          toolSummaries.length) *
          100,
      ) / 100;

indexMd = indexMd.replace(
  /> Coverage was last updated on [^.\n]+\./,
  `> Coverage was last updated on ${toHumanDate(new Date())}.`,
);
indexMd = indexMd.replace(
  />\s*Average across these five tools:\s*\*\*[^*]+\*\*\./,
  `> Average across these five tools: **${average}%**.`,
);

fs.writeFileSync(indexPath, indexMd);

console.log("Updated tool-parity coverage:");
for (const summary of toolSummaries) {
  console.log(`  ${summary.label}: ${summary.weightedPercent}%`);
}
console.log(`  Overall average: ${average}%`);
