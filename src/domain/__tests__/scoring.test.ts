import { describe, it, expect } from "vitest";
import { calculateValueScore, normalizeWeights } from "@/domain/scoring";
import { DEFAULT_WEIGHTS } from "@/domain/modelConfig";
import type { DimensionKey, DimensionScore } from "@/domain/types";

const mk = (n: 0|1|2|3|4): DimensionScore => ({ score: n, reason: "" });
const all = (n: 0|1|2|3|4): Record<DimensionKey, DimensionScore> => ({
  strategy: mk(n), userProblem: mk(n), systemImpact: mk(n),
  leverage: mk(n), deviceEnable: mk(n), competitive: mk(n),
});

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
  it("全 4 分 = 100.0", () => { expect(calculateValueScore(all(4), DEFAULT_WEIGHTS)).toBe(100.0); });
  it("全 0 分 = 0.0", () => { expect(calculateValueScore(all(0), DEFAULT_WEIGHTS)).toBe(0.0); });
  it("全 2 分 = 50.0", () => { expect(calculateValueScore(all(2), DEFAULT_WEIGHTS)).toBe(50.0); });
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
