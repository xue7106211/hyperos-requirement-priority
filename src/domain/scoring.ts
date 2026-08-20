import type { DimensionKey, DimensionScore, Weights } from "./types";
import { DIMENSION_KEYS } from "./types";
import { DEFAULT_WEIGHTS, DIMENSION_META } from "./modelConfig";

export function normalizeWeights(weights: Weights): { weights: Weights; wasNormalized: boolean } {
  const sum = DIMENSION_KEYS.reduce((a, k) => a + weights[k], 0);
  if (Math.abs(sum) < 1e-9) return { weights: DEFAULT_WEIGHTS, wasNormalized: true };
  if (Math.abs(sum - 100) < 1e-9) return { weights, wasNormalized: false };
  const scaled = {} as Weights;
  for (const k of DIMENSION_KEYS) scaled[k] = (weights[k] / sum) * 100;
  return { weights: scaled, wasNormalized: true };
}

/**
 * 价值分 = Σ（维度评分 ÷ 该维度满分 × 对应权重）
 *
 * 按各维度自身满分归一，保证任一维度打满分的贡献恰好等于它的权重，
 * 因此各维度档位数不同（如设备与生态赋能为 0–3）不会破坏权重平衡。
 */
export function calculateValueScore(
  scores: Record<DimensionKey, DimensionScore>,
  weights: Weights,
): number {
  const { weights: w } = normalizeWeights(weights);
  let total = 0;
  for (const k of DIMENSION_KEYS) {
    total += (scores[k].score / DIMENSION_META[k].maxScore) * w[k];
  }
  return Math.round(total * 10) / 10;
}
