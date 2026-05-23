const warnedMessages = new Set<string>();

export const warnOnce = (message: string): void => {
  if (warnedMessages.has(message)) {
    return;
  }
  warnedMessages.add(message);
  console.warn(message);
};
