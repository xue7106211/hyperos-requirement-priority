import { describe, it, expect } from "vitest";
import { calculateValueScore, normalizeWeights } from "@/domain/scoring";
import { DEFAULT_WEIGHTS, DIMENSION_META } from "@/domain/modelConfig";
import { DIMENSION_KEYS } from "@/domain/types";
import type { DimensionKey, DimensionScore, ScoreValue } from "@/domain/types";

/** 所有维度给同一个分值（仅用于合法范围内的分值） */
const all = (n: ScoreValue): Record<DimensionKey, DimensionScore> => {
  const out = {} as Record<DimensionKey, DimensionScore>;
  for (const k of DIMENSION_KEYS) out[k] = { score: n, reason: "" };
  return out;
};

/** 每个维度按自身满分打满 */
const full = (): Record<DimensionKey, DimensionScore> => {
  const out = {} as Record<DimensionKey, DimensionScore>;
  for (const k of DIMENSION_KEYS) {
    out[k] = { score: DIMENSION_META[k].maxScore as ScoreValue, reason: "" };
  }
  return out;
};

/** 只有指定维度得分，其余为 0 */
const only = (key: DimensionKey, score: ScoreValue): Record<DimensionKey, DimensionScore> => {
  const out = all(0);
  out[key] = { score, reason: "" };
  return out;
};

describe("normalizeWeights", () => {
  it("合计 100 时不改动", () => {
    const r = normalizeWeights(DEFAULT_WEIGHTS);
    expect(r.wasNormalized).toBe(false);
    expect(r.weights).toEqual(DEFAULT_WEIGHTS);
  });
  it("合计非 100 时按比例归一化，且归一后合计=100", () => {
    const r = normalizeWeights({ strategy:46,userProblem:34,systemImpact:40,leverage:36,deviceEnable:24,competitive:20 });
    expect(r.wasNormalized).toBe(true);
    const sum = Object.values(r.weights).reduce((a,b)=>a+b,0);
    expect(sum).toBeCloseTo(100, 6);
  });
  it("全零权重不产生 NaN，回退 DEFAULT_WEIGHTS", () => {
    const zeroWeights = { strategy:0,userProblem:0,systemImpact:0,leverage:0,deviceEnable:0,competitive:0 };
    const r = normalizeWeights(zeroWeights);
    expect(r.wasNormalized).toBe(true);
    expect(r.weights).toEqual(DEFAULT_WEIGHTS);
    // 使用全零权重计算分值不应产生 NaN
    const score = calculateValueScore(all(3), zeroWeights);
    expect(Number.isFinite(score)).toBe(true);
    expect(Number.isNaN(score)).toBe(false);
  });
});

describe("calculateValueScore", () => {
  it("各维按自身满分打满 = 100.0", () => {
    expect(calculateValueScore(full(), DEFAULT_WEIGHTS)).toBe(100.0);
  });
  it("全 0 分 = 0.0", () => { expect(calculateValueScore(all(0), DEFAULT_WEIGHTS)).toBe(0.0); });

  it("任一维度打满时的贡献恰好等于其权重（与该维档位数无关）", () => {
    for (const k of DIMENSION_KEYS) {
      const max = DIMENSION_META[k].maxScore as ScoreValue;
      expect(calculateValueScore(only(k, max), DEFAULT_WEIGHTS)).toBeCloseTo(DEFAULT_WEIGHTS[k], 6);
    }
  });

  it("设备与生态赋能按四档归一：1 分贡献 4.0，2 分贡献 8.0", () => {
    expect(calculateValueScore(only("deviceEnable", 1), DEFAULT_WEIGHTS)).toBe(4.0);
    expect(calculateValueScore(only("deviceEnable", 2), DEFAULT_WEIGHTS)).toBe(8.0);
  });

  it("五档维度仍按 /4 归一：战略 1 分贡献 5.8", () => {
    expect(calculateValueScore(only("strategy", 1), DEFAULT_WEIGHTS)).toBe(5.8);
  });

  it("结果保留一位小数", () => {
    const v = calculateValueScore(all(3), DEFAULT_WEIGHTS);
    expect(Number.isFinite(v)).toBe(true);
    expect(Math.round(v * 10) / 10).toBe(v);
  });
  it("相同输入稳定复现", () => {
    expect(calculateValueScore(all(3), DEFAULT_WEIGHTS)).toBe(calculateValueScore(all(3), DEFAULT_WEIGHTS));
  });
  it("非归一权重与其归一版结果一致", () => {
    const doubled = Object.fromEntries(Object.entries(DEFAULT_WEIGHTS).map(([k,v])=>[k,v*2])) as typeof DEFAULT_WEIGHTS;
    expect(calculateValueScore(all(3), doubled)).toBe(calculateValueScore(all(3), DEFAULT_WEIGHTS));
  });
});
