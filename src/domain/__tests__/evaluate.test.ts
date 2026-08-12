import { describe, it, expect } from "vitest";
import { evaluate } from "@/domain/evaluate";
import { DEFAULT_CONFIG } from "@/domain/modelConfig";
import type { Requirement, DimensionScore, DimensionKey } from "@/domain/types";

const mk = (n:0|1|2|3|4): DimensionScore => ({ score:n, reason:"r" });
function req(n:0|1|2|3|4, trigger:Requirement["escalationTrigger"]=null, tags:string[]=[]): Requirement {
  const scores = { strategy:mk(n),userProblem:mk(n),systemImpact:mk(n),leverage:mk(n),deviceEnable:mk(n),competitive:mk(n) } as Record<DimensionKey,DimensionScore>;
  return {
    id:"1",name:"x",description:"",problemStatement:"",mainCategory:"平台基建",tags,
    targetUserScenario:"",expectedCapability:"",affectedScope:"",frequency:"",strategyWindow:"",
    businessRequesterCount:0,evidence:"",competitiveEvidence:"",escalationTrigger:trigger,
    scores,confidence:"中",valueScore:null,grade:"C",modelVersion:"",weightsSnapshot:{} as any,
    thresholdsSnapshot:{S:85,A:70,B:50},evaluatedAt:"",
  };
}

describe("evaluate", () => {
  it("直升命中：valueScore 为 null，等级取直升结果，不受六维影响", () => {
    const r = evaluate(req(0, "legal"), DEFAULT_CONFIG, "2026-08-12T00:00:00Z");
    expect(r.valueScore).toBeNull();
    expect(r.grade).toBe("S");
  });
  it("黄色舆情直升 A", () => {
    expect(evaluate(req(4, "yellow"), DEFAULT_CONFIG, "t").grade).toBe("A");
  });
  it("未直升：全 4 分 → 100 → S", () => {
    const r = evaluate(req(4), DEFAULT_CONFIG, "t");
    expect(r.valueScore).toBe(100);
    expect(r.grade).toBe("S");
  });
  it("标签数量不改变分数", () => {
    const a = evaluate(req(3, null, []), DEFAULT_CONFIG, "t");
    const b = evaluate(req(3, null, ["折叠屏","Token","战略"]), DEFAULT_CONFIG, "t");
    expect(a.valueScore).toBe(b.valueScore);
    expect(a.grade).toBe(b.grade);
  });
  it("相同输入稳定复现", () => {
    const a = evaluate(req(3), DEFAULT_CONFIG, "t");
    const b = evaluate(req(3), DEFAULT_CONFIG, "t");
    expect(a).toEqual(b);
  });
  it("冻结权重与阈值快照", () => {
    const r = evaluate(req(3), DEFAULT_CONFIG, "t");
    expect(r.weightsSnapshot).toEqual(DEFAULT_CONFIG.weights);
    expect(r.thresholdsSnapshot).toEqual(DEFAULT_CONFIG.thresholds);
  });
});
