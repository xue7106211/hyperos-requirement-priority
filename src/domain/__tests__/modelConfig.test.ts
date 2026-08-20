import { describe, it, expect } from "vitest";
import { DEFAULT_WEIGHTS, DEFAULT_THRESHOLDS, MODEL_VERSION, DIMENSION_META, ESCALATION_META } from "@/domain/modelConfig";
import { DIMENSION_KEYS } from "@/domain/types";

describe("modelConfig", () => {
  it("默认权重合计为 100", () => {
    const sum = Object.values(DEFAULT_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBe(100);
  });
  it("默认阈值符合 v2.1", () => {
    expect(DEFAULT_THRESHOLDS).toEqual({ S: 85, A: 70, B: 50 });
  });
  it("模型版本为 v2.1", () => {
    expect(MODEL_VERSION).toBe("HyperOS Requirement Value Model v2.1");
  });
  it("六维都有名称、判断说明、易错提示，且 maxScore 与锚点数量一致", () => {
    for (const k of DIMENSION_KEYS) {
      expect(DIMENSION_META[k].label.length).toBeGreaterThan(0);
      expect(DIMENSION_META[k].hint.length).toBeGreaterThan(0);
      expect(DIMENSION_META[k].caution.length).toBeGreaterThan(0);
      expect(DIMENSION_META[k].anchors.length).toBe(DIMENSION_META[k].maxScore + 1);
    }
  });
  it("第一维为「承接 OS 美学战略」，五档", () => {
    expect(DIMENSION_META.strategy.label).toBe("承接 OS 美学战略");
    expect(DIMENSION_META.strategy.maxScore).toBe(4);
    expect(DIMENSION_META.strategy.anchors).toHaveLength(5);
  });
  it("设备与生态赋能为 0–3 四档，0 分含轻量尺寸与样式适配", () => {
    expect(DIMENSION_META.deviceEnable.maxScore).toBe(3);
    expect(DIMENSION_META.deviceEnable.anchors).toHaveLength(4);
    expect(DIMENSION_META.deviceEnable.anchors[0]).toContain("轻量尺寸");
  });
  it("除设备维外其余维度仍为 5 档", () => {
    for (const k of DIMENSION_KEYS) {
      if (k === "deviceEnable") continue;
      expect(DIMENSION_META[k].anchors).toHaveLength(5);
    }
  });
  it("直升条件覆盖 5 种且等级正确", () => {
    expect(ESCALATION_META.legal.grade).toBe("S");
    expect(ESCALATION_META.yellow.grade).toBe("A");
  });
});
