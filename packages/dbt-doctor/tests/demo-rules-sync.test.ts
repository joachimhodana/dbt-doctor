import { describe, expect, it } from "vite-plus/test";
import { ALL_DBT_DOCTOR_RULE_KEYS } from "dbt-doctor-rules";
import {
  BUILTIN_RULE_COUNT,
  HIDDEN_GOVERNANCE_RULE_IDS,
  HIDDEN_SQL_STYLE_RULE_IDS,
} from "../../website/src/constants/demo-rules.js";

const LANDING_VISIBLE_RULE_IDS = [
  "source-in-downstream",
  "hardcoded-database",
  "no-run-query-in-model",
  "staging-no-join",
  "no-select-star",
  "schema-description",
  "source-freshness",
  "model-outside-layer-folder",
] as const;

describe("landing demo rules", () => {
  it("references only built-in rule ids", () => {
    const demoRuleIds = [
      ...LANDING_VISIBLE_RULE_IDS,
      ...HIDDEN_GOVERNANCE_RULE_IDS,
      ...HIDDEN_SQL_STYLE_RULE_IDS,
    ];

    expect(new Set(demoRuleIds).size).toBe(demoRuleIds.length);
    for (const ruleId of demoRuleIds) {
      expect(ALL_DBT_DOCTOR_RULE_KEYS, `unknown demo rule: ${ruleId}`).toContain(ruleId);
    }
  });

  it("matches the published built-in rule count", () => {
    expect(ALL_DBT_DOCTOR_RULE_KEYS.length).toBe(BUILTIN_RULE_COUNT);
  });
});
