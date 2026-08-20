import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { RequirementForm } from "@/components/RequirementForm";
import { DEFAULT_CONFIG, DIMENSION_META } from "@/domain/modelConfig";
import { DIMENSION_KEYS } from "@/domain/types";
import type { Requirement } from "@/domain/types";

/** 把六个维度都点到各自的最高档 */
function selectMaxForAllDimensions() {
  const groups = screen.getAllByRole("radiogroup", { name: "评分档位" });
  expect(groups).toHaveLength(6);
  groups.forEach((group) => {
    const radios = within(group).getAllByRole("radio");
    fireEvent.click(radios[radios.length - 1]);
  });
}

describe("RequirementForm", () => {
  it("各维打满后实时面板显示 100.0 与 S 级", async () => {
    render(<RequirementForm initial={undefined} config={DEFAULT_CONFIG} onSave={()=>{}} />);
    selectMaxForAllDimensions();
    // 各维按自身满分归一，打满合计 = 权重合计 = 100
    expect(screen.getByText("100.0")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("S")).toBeInTheDocument();
    });
  });

  it("设备与生态赋能只提供 4 个档位，其余维度 5 个", () => {
    render(<RequirementForm initial={undefined} config={DEFAULT_CONFIG} onSave={()=>{}} />);
    const groups = screen.getAllByRole("radiogroup", { name: "评分档位" });
    DIMENSION_KEYS.forEach((key, i) => {
      const radios = within(groups[i]).getAllByRole("radio");
      expect(radios).toHaveLength(DIMENSION_META[key].maxScore + 1);
    });
  });

  it("选择直升条件后六维区禁用且面板显示直升", async () => {
    render(<RequirementForm initial={undefined} config={DEFAULT_CONFIG} onSave={()=>{}} />);
    fireEvent.click(screen.getByLabelText(/法律/));
    await waitFor(() => {
      expect(screen.getByText(/直升/)).toBeInTheDocument();
    });
  });

  it("展示维度判断说明与按维度满分的档位标准入口", () => {
    render(<RequirementForm initial={undefined} config={DEFAULT_CONFIG} onSave={() => {}} />);
    expect(
      screen.getByText(/判断需求是否承接 HyperOS 的美学战略方向/)
    ).toBeInTheDocument();
    expect(screen.getAllByText("查看 0–4 分标准")).toHaveLength(5);
    expect(screen.getAllByText("查看 0–3 分标准")).toHaveLength(1);
  });

  it("不再提供置信度输入", () => {
    render(<RequirementForm initial={undefined} config={DEFAULT_CONFIG} onSave={() => {}} />);
    expect(screen.queryByText("置信度")).not.toBeInTheDocument();
  });

  it("保存时写入 v2.1 模型版本与权重阈值快照", async () => {
    const onSave = vi.fn();
    const initial: Requirement = {
      id: "test-id",
      name: "保存测试",
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
      valueScore: 50,
      grade: "B",
      modelVersion: "HyperOS Requirement Value Model v2.0",
      weightsSnapshot: DEFAULT_CONFIG.weights,
      thresholdsSnapshot: DEFAULT_CONFIG.thresholds,
      evaluatedAt: "2026-01-01T00:00:00Z",
    };
    render(<RequirementForm initial={initial} config={DEFAULT_CONFIG} onSave={onSave} />);

    fireEvent.click(screen.getByText("保存评估"));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1);
    });
    const savedReq = onSave.mock.calls[0][0];
    expect(savedReq.modelVersion).toBe("HyperOS Requirement Value Model v2.1");
    expect(savedReq.weightsSnapshot).toEqual(DEFAULT_CONFIG.weights);
    expect(savedReq.confidence).toBeUndefined();
    // 设备维 2 分在四档下贡献 8.0，总分高于旧五档的 6.0
    expect(savedReq.valueScore).toBe(52.0);
  });
});
