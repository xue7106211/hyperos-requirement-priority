import type { Grade, Thresholds } from "./types";

export function assignGrade(valueScore: number, t: Thresholds): Grade {
  if (valueScore >= t.S) return "S";
  if (valueScore >= t.A) return "A";
  if (valueScore >= t.B) return "B";
  return "C";
}
