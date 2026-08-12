import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RequirementForm } from "@/components/RequirementForm";
import { DEFAULT_CONFIG } from "@/domain/modelConfig";

describe("RequirementForm", () => {
  it("修改维度分后实时面板分数更新", async () => {
    render(<RequirementForm initial={undefined} config={DEFAULT_CONFIG} onSave={()=>{}} />);
    // 六维全给 4（各维找到 ScoreSelector 的 "4" 按钮点击）
    screen.getAllByText("4").forEach(btn => fireEvent.click(btn));
    // With all dimensions at 4 and default weights summing to 100,
    // valueScore = 100. LiveResultPanel renders it as "100.0" via .toFixed(1)
    expect(screen.getByText("100.0")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("S")).toBeInTheDocument();
    });
  });
  it("选择直升条件后六维区禁用且面板显示直升", async () => {
    render(<RequirementForm initial={undefined} config={DEFAULT_CONFIG} onSave={()=>{}} />);
    fireEvent.click(screen.getByLabelText(/法律/));
    await waitFor(() => {
      expect(screen.getByText(/直升/)).toBeInTheDocument();
    });
  });
});
