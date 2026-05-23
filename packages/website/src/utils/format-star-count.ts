const formatCompactCount = (count: number, divisor: number, suffix: string): string => {
  const value = count / divisor;
  if (value >= 10) return `${Math.round(value)}${suffix}`;
  return `${value.toFixed(1).replace(/\.0$/, "")}${suffix}`;
};

export const formatStarCount = (count: number): string => {
  if (count >= 1_000_000) return formatCompactCount(count, 1_000_000, "M");
  if (count >= 1_000) return formatCompactCount(count, 1_000, "k");
  return count.toLocaleString("en-US");
};
