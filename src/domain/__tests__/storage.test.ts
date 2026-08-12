import { describe, it, expect, beforeEach } from "vitest";
import { loadRequirements, saveRequirements, loadConfig, saveConfig } from "@/store/storage";
import { DEFAULT_CONFIG } from "@/domain/modelConfig";

beforeEach(() => localStorage.clear());

describe("storage", () => {
  it("空存储返回空需求数组", () => { expect(loadRequirements()).toEqual([]); });
  it("空存储返回默认配置", () => { expect(loadConfig()).toEqual(DEFAULT_CONFIG); });
  it("保存后可读回需求", () => {
    const reqs = [{ id:"1" } as any];
    saveRequirements(reqs);
    expect(loadRequirements()).toEqual(reqs);
  });
  it("保存后可读回配置", () => {
    const c = { weights:{...DEFAULT_CONFIG.weights, strategy:30}, thresholds:{S:80,A:65,B:45} };
    saveConfig(c);
    expect(loadConfig()).toEqual(c);
  });
});
