import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RequirementForm } from "@/components/RequirementForm";
import { DEFAULT_CONFIG } from "@/domain/modelConfig";
import type { Requirement } from "@/domain/types";

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
  it("默认置信度为「中」且面板显示该值", () => {
    render(<RequirementForm initial={undefined} config={DEFAULT_CONFIG} onSave={() => {}} />);
    const display = screen.getByTestId("confidence-display");
    expect(display).toHaveTextContent("中");
  });
  it("传入 initial.confidence=高 时面板显示「高」且保存包含该值", async () => {
    const onSave = vi.fn();
    // 构造一个 confidence="高" 的 initial,含评分理由以避免 warning dialog
    const initial: Requirement = {
      id: "test-id",
      name: "置信度测试",
      description: "",
      problemStatement: "",
      mainCategory: "体验优化",
      tags: [],
      targetUserScenario: "",
      expectedCapability: "",
      affectedScope: "",
      frequency: "",
      strategyWindow: "",
      businessRequesterCount: 0,
      evidence: "",
      competitiveEvidence: "",
      escalationTrigger: null,
      scores: {
        strategy: { score: 2, reason: "r" },
        userProblem: { score: 2, reason: "r" },
        systemImpact: { score: 2, reason: "r" },
        leverage: { score: 2, reason: "r" },
        deviceEnable: { score: 2, reason: "r" },
        competitive: { score: 2, reason: "r" },
      },
      confidence: "高",
      valueScore: 50,
      grade: "B",
      modelVersion: "v1",
      weightsSnapshot: DEFAULT_CONFIG.weights,
      thresholdsSnapshot: DEFAULT_CONFIG.thresholds,
      evaluatedAt: "2026-01-01T00:00:00Z",
    };
    render(<RequirementForm initial={initial} config={DEFAULT_CONFIG} onSave={onSave} />);

    // 面板显示置信度=高
    expect(screen.getByTestId("confidence-display")).toHaveTextContent("高");

    // 保存
    fireEvent.click(screen.getByText("保存评估"));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1);
    });
    const savedReq = onSave.mock.calls[0][0];
    expect(savedReq.confidence).toBe("高");
  });
});
