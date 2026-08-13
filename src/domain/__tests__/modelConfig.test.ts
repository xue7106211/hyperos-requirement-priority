import { describe, it, expect } from "vitest";
import { DEFAULT_WEIGHTS, DEFAULT_THRESHOLDS, MODEL_VERSION, DIMENSION_META, ESCALATION_META } from "@/domain/modelConfig";
import { DIMENSION_KEYS } from "@/domain/types";

describe("modelConfig", () => {
  it("默认权重合计为 100", () => {
    const sum = Object.values(DEFAULT_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBe(100);
  });
  it("默认阈值符合 v2.0", () => {
    expect(DEFAULT_THRESHOLDS).toEqual({ S: 85, A: 70, B: 50 });
  });
  it("模型版本为 v2.0", () => {
    expect(MODEL_VERSION).toBe("HyperOS Requirement Value Model v2.0");
  });
  it("六维都有名称、判断说明、易错提示和 5 档锚点文案", () => {
    for (const k of DIMENSION_KEYS) {
      expect(DIMENSION_META[k].label.length).toBeGreaterThan(0);
      expect(DIMENSION_META[k].hint.length).toBeGreaterThan(0);
      expect(DIMENSION_META[k].caution.length).toBeGreaterThan(0);
      expect(DIMENSION_META[k].anchors).toHaveLength(5);
    }
  });
  it("直升条件覆盖 5 种且等级正确", () => {
    expect(ESCALATION_META.legal.grade).toBe("S");
    expect(ESCALATION_META.yellow.grade).toBe("A");
  });
});
