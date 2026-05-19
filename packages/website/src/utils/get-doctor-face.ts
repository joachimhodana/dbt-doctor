import { SCORE_GOOD_THRESHOLD, SCORE_OK_THRESHOLD } from "@/constants";

export const getDoctorFace = (score: number): [string, string] => {
  if (score >= SCORE_GOOD_THRESHOLD) return ["\u25E0 \u25E0", " \u25BD "];
  if (score >= SCORE_OK_THRESHOLD) return ["\u2022 \u2022", " \u2500 "];
  return ["x x", " \u25BD "];
};
