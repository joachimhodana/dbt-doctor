export { ALL_DBT_DOCTOR_RULES, ALL_DBT_DOCTOR_RULE_KEYS } from "./rule-registry.js";
export { runCustomRules } from "./run-custom-rules.js";
export type { Rule, RuleContext, DbtDoctorPlugin } from "./types.js";

import { ALL_DBT_DOCTOR_RULES } from "./rule-registry.js";
import type { DbtDoctorPlugin } from "./types.js";

const rulesRecord = Object.fromEntries(ALL_DBT_DOCTOR_RULES.map((rule) => [rule.id, rule]));

const dbtDoctorPlugin: DbtDoctorPlugin = { rules: rulesRecord };

export default dbtDoctorPlugin;
