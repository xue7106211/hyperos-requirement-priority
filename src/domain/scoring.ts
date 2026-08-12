import type { DimensionKey, DimensionScore, Weights } from "./types";
import { DIMENSION_KEYS } from "./types";

export function normalizeWeights(weights: Weights): { weights: Weights; wasNormalized: boolean } {
  const sum = DIMENSION_KEYS.reduce((a, k) => a + weights[k], 0);
  if (Math.abs(sum - 100) < 1e-9) return { weights, wasNormalized: false };
  const scaled = {} as Weights;
  for (const k of DIMENSION_KEYS) scaled[k] = (weights[k] / sum) * 100;
  return { weights: scaled, wasNormalized: true };
}

export function calculateValueScore(
  scores: Record<DimensionKey, DimensionScore>,
  weights: Weights,
): number {
  const { weights: w } = normalizeWeights(weights);
  let total = 0;
  for (const k of DIMENSION_KEYS) {
    total += (scores[k].score / 4) * w[k];
  }
  return Math.round(total * 10) / 10;
}
