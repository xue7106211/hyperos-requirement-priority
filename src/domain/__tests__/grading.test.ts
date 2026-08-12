import { describe, it, expect } from "vitest";
import { assignGrade } from "@/domain/grading";
import { DEFAULT_THRESHOLDS as T } from "@/domain/modelConfig";

describe("assignGrade 边界值", () => {
  it("85 → S", () => { expect(assignGrade(85, T)).toBe("S"); });
  it("84.9 → A", () => { expect(assignGrade(84.9, T)).toBe("A"); });
  it("70 → A", () => { expect(assignGrade(70, T)).toBe("A"); });
  it("69.9 → B", () => { expect(assignGrade(69.9, T)).toBe("B"); });
  it("50 → B", () => { expect(assignGrade(50, T)).toBe("B"); });
  it("49.9 → C", () => { expect(assignGrade(49.9, T)).toBe("C"); });
  it("0 → C", () => { expect(assignGrade(0, T)).toBe("C"); });
  it("100 → S", () => { expect(assignGrade(100, T)).toBe("S"); });
});
