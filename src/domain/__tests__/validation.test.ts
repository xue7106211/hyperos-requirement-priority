import { describe, it, expect } from "vitest";
import { validate } from "@/domain/validation";
import type { Requirement } from "@/domain/types";

function baseReq(): Requirement {
  // 每个维度必须是独立对象，否则单独改一维会连带改动其他维度
  const s = () => ({ score: 2 as const, reason: "有理由" });
  return {
    id: "1", name: "x", description: "", problemStatement: "",
    mainCategory: "平台基建", tags: [], targetUserScenario: "", expectedCapability: "",
    affectedScope: "", frequency: "", strategyWindow: "", businessRequesterCount: 0,
    evidence: "", competitiveEvidence: "", escalationTrigger: null,
    scores: { strategy:s(),userProblem:s(),systemImpact:s(),leverage:s(),deviceEnable:s(),competitive:s() },
    valueScore: null, grade: "C",
    modelVersion: "v2.1", weightsSnapshot: {} as any, thresholdsSnapshot: {S:85,A:70,B:50}, evaluatedAt: "",
  };
}

describe("validate", () => {
  it("合法输入 ok=true 无错误", () => {
    expect(validate(baseReq()).ok).toBe(true);
  });
  it("缺主类型 → 硬错误", () => {
    const r = baseReq(); (r as any).mainCategory = "";
    const v = validate(r);
    expect(v.ok).toBe(false);
    expect(v.errors.length).toBeGreaterThan(0);
  });
  it("维度分越界 → 硬错误", () => {
    const r = baseReq(); (r.scores.strategy as any).score = 7;
    expect(validate(r).ok).toBe(false);
  });
  it("设备与生态赋能为四档：3 分合法，4 分越界", () => {
    const ok = baseReq(); (ok.scores.deviceEnable as any).score = 3;
    expect(validate(ok).ok).toBe(true);

    const bad = baseReq(); (bad.scores.deviceEnable as any).score = 4;
    const v = validate(bad);
    expect(v.ok).toBe(false);
    expect(v.errors.some((e) => e.includes("设备与生态赋能"))).toBe(true);
    expect(v.errors.some((e) => e.includes("0–3"))).toBe(true);
  });
  it("五档维度 4 分仍合法", () => {
    const r = baseReq(); (r.scores.strategy as any).score = 4;
    expect(validate(r).ok).toBe(true);
  });
  it("理由为空 → 软提醒但仍 ok", () => {
    const r = baseReq(); r.scores.strategy.reason = "";
    const v = validate(r);
    expect(v.ok).toBe(true);
    expect(v.warnings.length).toBeGreaterThan(0);
  });
});
