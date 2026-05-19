import type { RuleSeverityControls, RuleSeverityOverride } from "@dbt-doctor/types";

interface RuleOverrideLookupInput {
  ruleKey: string;
  category?: string;
}

/**
 * Resolves the user-configured severity override for a rule.
 * Per-rule overrides win over per-category overrides. Returns
 * `undefined` when neither channel matches — callers should fall
 * back to the rule's built-in severity.
 */
export const resolveRuleSeverityOverride = (
  input: RuleOverrideLookupInput,
  controls: RuleSeverityControls | undefined,
): RuleSeverityOverride | undefined => {
  if (!controls) return undefined;
  return (
    controls.rules?.[input.ruleKey] ??
    (input.category !== undefined ? controls.categories?.[input.category] : undefined)
  );
};
