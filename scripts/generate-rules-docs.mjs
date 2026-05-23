#!/usr/bin/env node
/**
 * Generates packages/website/docs/rules/index.md from dbt-doctor-rules sources.
 * Run: node scripts/generate-rules-docs.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const slugifyHeading = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rulesDir = path.join(repoRoot, "packages/dbt-doctor-rules/src/rules");
const outDir = path.join(repoRoot, "packages/website/docs/rules");
const outFile = path.join(outDir, "index.md");

/** @type {Record<string, { options: { key: string; type: string; description: string; example?: string }[]; example?: string }>} */
const RULE_CONFIG_SCHEMA = {
  "column-desc-are-same": {
    options: [
      {
        key: "columns",
        type: "string[]",
        description: "Column names that must share the same description across models.",
        example: "amount,currency",
      },
    ],
    example: `rules.column-desc-are-same.columns=amount,currency`,
  },
  "column-name-contract": {
    options: [
      {
        key: "pattern.<matcher>",
        type: "string (regex)",
        description:
          "Matcher is a column name or `re:<regex>`. Value is the pattern the column name must match.",
        example: "pattern.amount=^.*_amount$",
      },
    ],
    example: `rules.column-name-contract.pattern.amount=^.*_amount$
rules.column-name-contract.pattern.re:.*_id$=^.*_id$`,
  },
  "database-casing-consistency": {
    options: [
      {
        key: "enabled",
        type: "boolean",
        description: "Opt-in rule. Requires manifest.json and catalog.json.",
        example: "true",
      },
    ],
    example: `rules.database-casing-consistency.enabled=true`,
  },
  "macro-arguments-have-desc": {
    options: [{ key: "enabled", type: "boolean", description: "Opt-in rule.", example: "true" }],
    example: `rules.macro-arguments-have-desc.enabled=true`,
  },
  "model-has-all-columns": {
    options: [
      {
        key: "required",
        type: "string[]",
        description: "Columns that must appear in the model schema YAML.",
        example: "id,created_at",
      },
    ],
    example: `rules.model-has-all-columns.required=id,created_at`,
  },
  "model-has-constraints": {
    options: [{ key: "enabled", type: "boolean", description: "Opt-in rule.", example: "true" }],
    example: `rules.model-has-constraints.enabled=true`,
  },
  "model-has-generic-constraints": {
    options: [{ key: "enabled", type: "boolean", description: "Opt-in rule.", example: "true" }],
    example: `rules.model-has-generic-constraints.enabled=true`,
  },
  "model-has-labels-keys": {
    options: [
      {
        key: "required",
        type: "string[]",
        description: "Required keys under `labels:` on each model.",
        example: "environment,tier",
      },
    ],
    example: `rules.model-has-labels-keys.required=environment,tier`,
  },
  "model-has-meta-keys": {
    options: [
      {
        key: "required",
        type: "string[]",
        description: "Required keys under `meta:` on each model.",
        example: "owner,team",
      },
    ],
    example: `rules.model-has-meta-keys.required=owner,team`,
  },
  "model-has-tests-by-group": {
    options: [
      {
        key: "uniqueness | nullness | relationships | accepted_values",
        type: "number",
        description: "Minimum tests in each group (see rule source for group membership).",
        example: "uniqueness=1",
      },
    ],
    example: `rules.model-has-tests-by-group.uniqueness=1
rules.model-has-tests-by-group.nullness=1`,
  },
  "model-has-tests-by-name": {
    options: [
      {
        key: "<test_name>",
        type: "number",
        description: "Minimum count per test name (e.g. unique, not_null, custom tests).",
        example: "unique=1",
      },
    ],
    example: `rules.model-has-tests-by-name.unique=1
rules.model-has-tests-by-name.not_null=1`,
  },
  "model-has-tests-by-type": {
    options: [
      { key: "schema", type: "number", description: "Minimum schema tests.", example: "2" },
      { key: "data", type: "number", description: "Minimum data tests.", example: "1" },
    ],
    example: `rules.model-has-tests-by-type.schema=2
rules.model-has-tests-by-type.data=1`,
  },
  "model-materialization-by-childs": {
    options: [
      { key: "minChildren", type: "number", description: "Child count threshold.", example: "3" },
      {
        key: "materialized",
        type: "string",
        description: "Expected materialization when threshold is met.",
        example: "table",
      },
    ],
    example: `rules.model-materialization-by-childs.minChildren=3
rules.model-materialization-by-childs.materialized=table`,
  },
  "model-name-contract": {
    options: [
      {
        key: "pattern",
        type: "string (regex)",
        description: "Model name must match this pattern.",
        example: "^(stg|int|fct|dim)_[a-z0-9_]+$",
      },
    ],
    example: `rules.model-name-contract.pattern=^(stg|int|fct|dim)_[a-z0-9_]+$`,
  },
  "model-parents-database": {
    options: [
      { key: "equals", type: "string", description: "All parents must use this database.", example: "analytics" },
    ],
    example: `rules.model-parents-database.equals=analytics`,
  },
  "model-parents-name-prefix": {
    options: [
      { key: "prefix", type: "string", description: "All parent model names must start with this prefix.", example: "stg_" },
    ],
    example: `rules.model-parents-name-prefix.prefix=stg_`,
  },
  "model-parents-schema": {
    options: [
      { key: "equals", type: "string", description: "All parents must use this schema.", example: "staging" },
    ],
    example: `rules.model-parents-schema.equals=staging`,
  },
  "model-tags": {
    options: [
      {
        key: "allowed",
        type: "string[]",
        description: "Models must have at least one of these tags.",
        example: "daily,hourly,nightly",
      },
    ],
    example: `rules.model-tags.allowed=daily,hourly,nightly`,
  },
  "sql-function-name-case": {
    options: [
      {
        key: "capitalisationPolicy",
        type: "upper | lower | consistent",
        description: "Function name casing policy.",
        example: "upper",
      },
    ],
    example: `rules.sql-function-name-case.capitalisationPolicy=upper`,
  },
  "sql-keywords-case": {
    options: [
      {
        key: "capitalisationPolicy",
        type: "upper | lower | consistent",
        description: "SQL keyword casing policy (default: consistent).",
        example: "upper",
      },
    ],
    example: `rules.sql-keywords-case.capitalisationPolicy=upper`,
  },
  "sql-leading-commas": {
    options: [
      { key: "enabled", type: "boolean", description: "Enable leading-comma layout (default: false).", example: "true" },
    ],
    example: `rules.sql-leading-commas.enabled=true`,
  },
  "sql-select-targets-layout": {
    options: [
      {
        key: "singleTargetPolicy",
        type: "string",
        description: "Layout policy for single select targets.",
        example: "single",
      },
      {
        key: "wildcardPolicy",
        type: "string",
        description: "Layout policy for wildcard selects.",
        example: "single",
      },
    ],
    example: `rules.sql-select-targets-layout.singleTargetPolicy=single`,
  },
  "sql-select-trailing-comma": {
    options: [
      {
        key: "enabled",
        type: "boolean",
        description: "Disallow trailing commas in SELECT lists (default: true).",
        example: "false",
      },
    ],
    example: `rules.sql-select-trailing-comma.enabled=false`,
  },
  "sql-trailing-commas": {
    options: [
      {
        key: "enabled",
        type: "boolean",
        description: "Enforce trailing commas (default: true).",
        example: "true",
      },
    ],
    example: `rules.sql-trailing-commas.enabled=true`,
  },
  "sql-union-explicit-qualifier": {
    options: [
      {
        key: "requireExplicitQualifier",
        type: "boolean",
        description: "Require UNION ALL or UNION DISTINCT (default: true).",
        example: "true",
      },
    ],
    example: `rules.sql-union-explicit-qualifier.requireExplicitQualifier=true`,
  },
  "sql-unquoted-identifiers-case": {
    options: [
      {
        key: "capitalisationPolicy",
        type: "upper | lower | consistent",
        description: "Unquoted identifier casing policy.",
        example: "lower",
      },
    ],
    example: `rules.sql-unquoted-identifiers-case.capitalisationPolicy=lower`,
  },
  "exposure-has-meta-keys": {
    options: [{ key: "required", type: "string[]", description: "Required exposure meta keys.", example: "owner" }],
    example: `rules.exposure-has-meta-keys.required=owner`,
  },
  "seed-has-meta-keys": {
    options: [{ key: "required", type: "string[]", description: "Required seed meta keys.", example: "owner" }],
    example: `rules.seed-has-meta-keys.required=owner`,
  },
  "snapshot-has-meta-keys": {
    options: [{ key: "required", type: "string[]", description: "Required snapshot meta keys.", example: "owner" }],
    example: `rules.snapshot-has-meta-keys.required=owner`,
  },
  "source-childs": {
    options: [{ key: "minChildren", type: "number", description: "Minimum downstream models per source.", example: "1" }],
    example: `rules.source-childs.minChildren=1`,
  },
  "source-has-labels-keys": {
    options: [{ key: "required", type: "string[]", description: "Required source labels keys.", example: "tier" }],
    example: `rules.source-has-labels-keys.required=tier`,
  },
  "source-has-meta-keys": {
    options: [{ key: "required", type: "string[]", description: "Required source meta keys.", example: "owner" }],
    example: `rules.source-has-meta-keys.required=owner`,
  },
  "source-tags": {
    options: [{ key: "allowed", type: "string[]", description: "Allowed source tags.", example: "raw,external" }],
    example: `rules.source-tags.allowed=raw,external`,
  },
  "test-has-meta-keys": {
    options: [{ key: "required", type: "string[]", description: "Required test meta keys.", example: "owner" }],
    example: `rules.test-has-meta-keys.required=owner`,
  },
  "test-tags": {
    options: [{ key: "allowed", type: "string[]", description: "Allowed test tags.", example: "critical,data" }],
    example: `rules.test-tags.allowed=critical,data`,
  },
};

const parseRuleFile = (filePath) => {
  const content = fs.readFileSync(filePath, "utf8");
  const id = content.match(/\bid:\s*["']([^"']+)["']/)?.[1];
  if (!id) return null;

  const severity = content.match(/\bseverity:\s*["'](error|warn)["']/)?.[1] ?? "warn";
  const category = content.match(/\bcategory:\s*["']([^"']+)["']/)?.[1] ?? "General";

  const tagsBlock = content.match(/\btags:\s*\[([^\]]*)\]/);
  const tags = tagsBlock
    ? tagsBlock[1]
        .split(",")
        .map((tag) => tag.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean)
    : [];

  const recMatch = content.match(/\brecommendation:\s*\n?\s*["']([^"']+)["']/s);
  const recommendation = recMatch?.[1] ?? "";

  const requiresManifest = /\brequiresManifest:\s*true/.test(content);
  const adapterMatch = content.match(/\brequiresAdapter:\s*\[([^\]]+)\]/);
  const requiresAdapter = adapterMatch
    ? adapterMatch[1]
        .split(",")
        .map((entry) => entry.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean)
    : [];

  return { id, severity, category, tags, recommendation, requiresManifest, requiresAdapter };
};

const ruleDocHref = (id) => `/docs/rules#${id}`;

const renderConfigSection = (rule) => {
  const schema = RULE_CONFIG_SCHEMA[rule.id];
  const lines = [];

  lines.push("**Configuration**");
  lines.push("");
  lines.push("| Option | Type | Description |");
  lines.push("| ------ | ---- | ----------- |");

  lines.push("| `severity` | `error` \\| `warn` \\| `off` | Set via `rules.<id>=` (not nested). |");

  if (schema) {
    for (const option of schema.options) {
      lines.push(`| \`${option.key}\` | ${option.type} | ${option.description} |`);
    }
    lines.push("");
    lines.push("Example `.dbt-doctor`:");
    lines.push("");
    lines.push("```ini");
    lines.push(`rules.${rule.id}=${rule.severity}`);
    lines.push(schema.example);
    lines.push("```");
  } else {
    lines.push("");
    lines.push("Example `.dbt-doctor`:");
    lines.push("");
    lines.push("```ini");
    lines.push(`rules.${rule.id}=${rule.severity}`);
    lines.push("```");
  }

  return lines.join("\n");
};

const renderRule = (rule) => {
  const lines = [];
  lines.push(`### ${rule.id} {#${rule.id}}`);
  lines.push("");
  lines.push(
    `**${rule.severity}** · ${rule.category}${rule.tags.length > 0 ? ` · tags: \`${rule.tags.join("`, `")}\`` : ""}`,
  );
  if (rule.requiresManifest) lines.push("");
  if (rule.requiresManifest) lines.push("- Requires `target/manifest.json`");
  if (rule.requiresAdapter.length > 0) {
    lines.push(`- Adapter: \`${rule.requiresAdapter.join("`, `")}\``);
  }
  lines.push("");
  const description =
    rule.recommendation ||
    "See the [Rules reference](/docs/rules) for configuration options.";
  lines.push(description);
  lines.push("");
  lines.push(renderConfigSection(rule));
  lines.push("");
  return lines.join("\n");
};

const files = fs.readdirSync(rulesDir).filter((name) => name.endsWith(".ts"));
const rules = files.map((name) => parseRuleFile(path.join(rulesDir, name))).filter(Boolean);
rules.sort((left, right) => {
  const category = left.category.localeCompare(right.category);
  if (category !== 0) return category;
  return left.id.localeCompare(right.id);
});

const byCategory = new Map();
for (const rule of rules) {
  const list = byCategory.get(rule.category) ?? [];
  list.push(rule);
  byCategory.set(rule.category, list);
}

const categories = [...byCategory.keys()].sort((left, right) => left.localeCompare(right));

const output = [];
output.push("# Rules reference");
output.push("");
output.push(
  `${rules.length} built-in rules. Configure severity and per-rule options in [\`.dbt-doctor\`](/docs/getting-started/configuration) at the repo root.`,
);
output.push("");
output.push("## Configuration format");
output.push("");
output.push("```ini");
output.push("# Severity: error | warn | off");
output.push("rules.no-select-star=warn");
output.push("");
output.push("# Per-rule options (nested keys)");
output.push("rules.model-has-meta-keys=error");
output.push("rules.model-has-meta-keys.required=owner,team");
output.push("```");
output.push("");
output.push("See [Configuration](/docs/getting-started/configuration) for a full example.");
output.push("");
output.push(
  "See also [Tool parity](/docs/tool-parity) for how these rules map to SQLFluff, dbt_project_evaluator, dbt-checkpoint, and other tools.",
);
output.push("");
output.push("## Rule index");
output.push("");
for (const category of categories) {
  output.push(`- [${category}](#${slugifyHeading(category)})`);
}
output.push("");

for (const category of categories) {
  output.push(`## ${category} {#${slugifyHeading(category)}}`);
  output.push("");
  const categoryRules = byCategory.get(category) ?? [];
  for (const rule of categoryRules) {
    output.push(`- [\`${rule.id}\`](#${rule.id})`);
  }
  output.push("");
  for (const rule of categoryRules) {
    output.push(renderRule(rule));
  }
}

const navPayload = {
  categories: categories.map((category) => ({
    id: slugifyHeading(category),
    title: category,
    rules: (byCategory.get(category) ?? []).map((rule) => rule.id),
  })),
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, `${output.join("\n")}\n`);
fs.writeFileSync(path.join(outDir, "nav.json"), `${JSON.stringify(navPayload, null, 2)}\n`);
console.log(`Wrote ${rules.length} rules to ${path.relative(repoRoot, outFile)}`);

// Export mapping for tool-parity link script
const mappingPath = path.join(outDir, ".rule-ids.json");
fs.writeFileSync(mappingPath, `${JSON.stringify(rules.map((rule) => rule.id), null, 2)}\n`);
