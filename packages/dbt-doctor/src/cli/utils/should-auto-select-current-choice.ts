import type { PromptMultiselectChoiceState } from "@dbt-doctor/types";

export const shouldAutoSelectCurrentChoice = (
  choiceStates: PromptMultiselectChoiceState[],
  cursor: number,
): boolean => {
  const hasSelection = choiceStates.some((choiceState) => choiceState.selected);
  if (hasSelection) return false;

  const currentChoice = choiceStates[cursor];
  return Boolean(currentChoice) && !currentChoice.disabled;
};
