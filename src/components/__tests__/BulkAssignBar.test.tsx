import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BulkAssignBar } from "@/components/BulkAssignBar";

describe("BulkAssignBar", () => {
  it("选维度+分数后点应用触发 onApply", () => {
    const fn = vi.fn();
    render(<BulkAssignBar onApply={fn} />);
    // 选择维度与分数的交互后点击「应用到筛选结果」
    fireEvent.click(screen.getByText("应用到筛选结果"));
    expect(fn).toHaveBeenCalled();
  });
});
