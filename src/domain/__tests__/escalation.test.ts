import { describe, it, expect } from "vitest";
import { checkEscalation } from "@/domain/escalation";

describe("checkEscalation", () => {
  it("法律红线直升 S", () => { expect(checkEscalation("legal")).toBe("S"); });
  it("红橙舆情直升 S", () => { expect(checkEscalation("redOrange")).toBe("S"); });
  it("阻塞新形态直升 S", () => { expect(checkEscalation("blockDevice")).toBe("S"); });
  it("硬件卖点直升 S", () => { expect(checkEscalation("hardwareSell")).toBe("S"); });
  it("黄色舆情直升 A", () => { expect(checkEscalation("yellow")).toBe("A"); });
  it("未命中返回 null", () => { expect(checkEscalation(null)).toBeNull(); });
});
