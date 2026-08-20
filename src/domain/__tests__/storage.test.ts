import { describe, it, expect, beforeEach } from "vitest";
import { loadRequirements, saveRequirements, loadConfig, saveConfig } from "@/store/storage";
import { DEFAULT_CONFIG } from "@/domain/modelConfig";
import { DIMENSION_KEYS } from "@/domain/types";

const REQ_KEY = "hyperos-rvm-v2:requirements";

beforeEach(() => localStorage.clear());

describe("storage", () => {
  it("空存储返回空需求数组", () => { expect(loadRequirements()).toEqual([]); });
  it("空存储返回默认配置", () => { expect(loadConfig()).toEqual(DEFAULT_CONFIG); });
  it("保存后可读回需求", () => {
    const reqs = [{ id:"1" } as any];
    saveRequirements(reqs);
    const loaded = loadRequirements();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe("1");
  });
  it("保存后可读回配置", () => {
    const c = { weights:{...DEFAULT_CONFIG.weights, strategy:30}, thresholds:{S:80,A:65,B:45} };
    saveConfig(c);
    expect(loadConfig()).toEqual(c);
  });
  it("缺失维度评分被补齐为 0 分空理由", () => {
    saveRequirements([{ id:"1" } as any]);
    const loaded = loadRequirements();
    for (const k of DIMENSION_KEYS) {
      expect(loaded[0].scores[k]).toEqual({ score: 0, reason: "" });
    }
  });
  it("非数组内容返回空数组", () => {
    localStorage.setItem(REQ_KEY, JSON.stringify({ oops: true }));
    expect(loadRequirements()).toEqual([]);
  });
});

describe("storage 向后兼容 v2.0 记录", () => {
  /** 一条 v2.0 记录：含 confidence，设备维为 4 分 */
  function legacyRecord() {
    return {
      id: "legacy-1",
      name: "旧记录",
      mainCategory: "平台基建",
      confidence: "低",
      scores: {
        strategy: { score: 3, reason: "r" },
        userProblem: { score: 2, reason: "r" },
        systemImpact: { score: 2, reason: "r" },
        leverage: { score: 3, reason: "r" },
        deviceEnable: { score: 4, reason: "r" },
        competitive: { score: 1, reason: "r" },
      },
      valueScore: 71.3,
      grade: "A",
      modelVersion: "HyperOS Requirement Value Model v2.0",
      evaluatedAt: "2026-08-13T00:00:00Z",
    };
  }

  it("丢弃 confidence 字段", () => {
    localStorage.setItem(REQ_KEY, JSON.stringify([legacyRecord()]));
    const loaded = loadRequirements();
    expect("confidence" in loaded[0]).toBe(false);
  });

  it("超出新满分的设备维分数被收敛到 3", () => {
    localStorage.setItem(REQ_KEY, JSON.stringify([legacyRecord()]));
    expect(loadRequirements()[0].scores.deviceEnable.score).toBe(3);
  });

  it("不重算价值分与等级，不改写 modelVersion", () => {
    localStorage.setItem(REQ_KEY, JSON.stringify([legacyRecord()]));
    const loaded = loadRequirements()[0];
    expect(loaded.valueScore).toBe(71.3);
    expect(loaded.grade).toBe("A");
    expect(loaded.modelVersion).toBe("HyperOS Requirement Value Model v2.0");
    expect(loaded.evaluatedAt).toBe("2026-08-13T00:00:00Z");
  });

  it("范围内的分数与理由原样保留", () => {
    localStorage.setItem(REQ_KEY, JSON.stringify([legacyRecord()]));
    const loaded = loadRequirements()[0];
    expect(loaded.scores.strategy).toEqual({ score: 3, reason: "r" });
    expect(loaded.scores.competitive).toEqual({ score: 1, reason: "r" });
  });

  it("非法分数（负数或非整数）回落为 0", () => {
    const broken = legacyRecord();
    (broken.scores.strategy as any).score = -2;
    (broken.scores.userProblem as any).score = 2.5;
    localStorage.setItem(REQ_KEY, JSON.stringify([broken]));
    const loaded = loadRequirements()[0];
    expect(loaded.scores.strategy.score).toBe(0);
    expect(loaded.scores.userProblem.score).toBe(0);
  });
});
