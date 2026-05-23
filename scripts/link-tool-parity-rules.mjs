#!/usr/bin/env node
/**
 * Links `rule-id` mentions in tool-parity docs to /docs/rules#rule-id
 * Run after generate-rules-docs.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ruleIdsPath = path.join(repoRoot, "packages/website/docs/rules/.rule-ids.json");
const toolParityDir = path.join(repoRoot, "packages/website/docs/tool-parity");

const ruleIds = JSON.parse(fs.readFileSync(ruleIdsPath, "utf8"));
const sortedIds = [...ruleIds].sort((left, right) => right.length - left.length);

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

for (const fileName of fs.readdirSync(toolParityDir)) {
  if (!fileName.endsWith(".md")) continue;
  const filePath = path.join(toolParityDir, fileName);
  let content = fs.readFileSync(filePath, "utf8");

  for (const ruleId of sortedIds) {
    const pattern = new RegExp("(?<!\\])`" + escapeRegex(ruleId) + "`(?!\\])", "g");
    content = content.replace(pattern, "[`" + ruleId + "`](/docs/rules#" + ruleId + ")");
  }

  fs.writeFileSync(filePath, content);
}

console.log(`Linked ${sortedIds.length} rule ids in ${toolParityDir}`);
