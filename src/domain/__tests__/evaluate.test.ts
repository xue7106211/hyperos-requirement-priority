import { describe, it, expect } from "vitest";
import { evaluate } from "@/domain/evaluate";
import { DEFAULT_CONFIG, DIMENSION_META } from "@/domain/modelConfig";
import { DIMENSION_KEYS } from "@/domain/types";
import type { Requirement, DimensionScore, DimensionKey, ScoreValue } from "@/domain/types";

const mk = (n: ScoreValue): DimensionScore => ({ score: n, reason: "r" });

/** 所有维度同分（需在各维合法范围内） */
function sameScores(n: ScoreValue): Record<DimensionKey, DimensionScore> {
  const out = {} as Record<DimensionKey, DimensionScore>;
  for (const k of DIMENSION_KEYS) out[k] = mk(n);
  return out;
}

/** 每个维度按自身满分打满 */
function fullScores(): Record<DimensionKey, DimensionScore> {
  const out = {} as Record<DimensionKey, DimensionScore>;
  for (const k of DIMENSION_KEYS) out[k] = mk(DIMENSION_META[k].maxScore as ScoreValue);
  return out;
}

function req(
  scores: Record<DimensionKey, DimensionScore>,
  trigger: Requirement["escalationTrigger"] = null,
  tags: string[] = [],
): Requirement {
  return {
    id:"1",name:"x",description:"",problemStatement:"",mainCategory:"平台基建",tags,
    targetUserScenario:"",expectedCapability:"",affectedScope:"",frequency:"",strategyWindow:"",
    businessRequesterCount:0,evidence:"",competitiveEvidence:"",escalationTrigger:trigger,
    scores,valueScore:null,grade:"C",modelVersion:"",weightsSnapshot:{} as any,
    thresholdsSnapshot:{S:85,A:70,B:50},evaluatedAt:"",
  };
}

describe("evaluate", () => {
  it("直升命中：valueScore 为 null，等级取直升结果，不受六维影响", () => {
    const r = evaluate(req(sameScores(0), "legal"), DEFAULT_CONFIG, "2026-08-12T00:00:00Z");
    expect(r.valueScore).toBeNull();
    expect(r.grade).toBe("S");
  });
  it("黄色舆情直升 A", () => {
    expect(evaluate(req(fullScores(), "yellow"), DEFAULT_CONFIG, "t").grade).toBe("A");
  });
  it("未直升：各维打满 → 100 → S", () => {
    const r = evaluate(req(fullScores()), DEFAULT_CONFIG, "t");
    expect(r.valueScore).toBe(100);
    expect(r.grade).toBe("S");
  });
  it("标签数量不改变分数", () => {
    const a = evaluate(req(sameScores(3), null, []), DEFAULT_CONFIG, "t");
    const b = evaluate(req(sameScores(3), null, ["折叠屏","Token","美学战略"]), DEFAULT_CONFIG, "t");
    expect(a.valueScore).toBe(b.valueScore);
    expect(a.grade).toBe(b.grade);
  });
  it("相同输入稳定复现", () => {
    const a = evaluate(req(sameScores(3)), DEFAULT_CONFIG, "t");
    const b = evaluate(req(sameScores(3)), DEFAULT_CONFIG, "t");
    expect(a).toEqual(b);
  });
  it("冻结权重与阈值快照", () => {
    const r = evaluate(req(sameScores(3)), DEFAULT_CONFIG, "t");
    expect(r.weightsSnapshot).toEqual(DEFAULT_CONFIG.weights);
    expect(r.thresholdsSnapshot).toEqual(DEFAULT_CONFIG.thresholds);
  });
});
