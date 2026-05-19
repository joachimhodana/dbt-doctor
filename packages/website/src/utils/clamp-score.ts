import { PERFECT_SCORE } from "@/constants";

export const clampScore = (value: number): number => Math.max(0, Math.min(PERFECT_SCORE, value));
