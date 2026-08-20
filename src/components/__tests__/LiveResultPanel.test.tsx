import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LiveResultPanel } from "@/components/LiveResultPanel";
import { DEFAULT_WEIGHTS } from "@/domain/modelConfig";
import { DIMENSION_KEYS } from "@/domain/types";
import type { DimensionKey, DimensionScore } from "@/domain/types";

function zeroScores(): Record<DimensionKey, DimensionScore> {
  const out = {} as Record<DimensionKey, DimensionScore>;
  for (const k of DIMENSION_KEYS) out[k] = { score: 0, reason: "" };
  return out;
}

describe("LiveResultPanel", () => {
  it("普通评估显示分数与等级", () => {
    render(
      <LiveResultPanel
        result={{
          valueScore: 78.5,
          grade: "A",
          weightsSnapshot: DEFAULT_WEIGHTS,
          thresholdsSnapshot: { S: 85, A: 70, B: 50 },
          wasNormalized: false,
        }}
        scores={zeroScores()}
        weights={DEFAULT_WEIGHTS}
        escalationTrigger={null}
      />
    );
    expect(screen.getByText("78.5")).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /六维评分雷达/ })).toBeInTheDocument();
  });

  it("直升时显示「直升」而非分数", () => {
    render(
      <LiveResultPanel
        result={{
          valueScore: null,
          grade: "S",
          weightsSnapshot: DEFAULT_WEIGHTS,
          thresholdsSnapshot: { S: 85, A: 70, B: 50 },
          wasNormalized: false,
        }}
        scores={zeroScores()}
        weights={DEFAULT_WEIGHTS}
        escalationTrigger={"legal"}
      />
    );
    expect(screen.getByText(/直升 ·/)).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /六维评分雷达/ })).not.toBeInTheDocument();
  });

  it("wasNormalized 为 true 时显示归一化提示", () => {
    render(
      <LiveResultPanel
        result={{
          valueScore: 65.0,
          grade: "B",
          weightsSnapshot: DEFAULT_WEIGHTS,
          thresholdsSnapshot: { S: 85, A: 70, B: 50 },
          wasNormalized: true,
        }}
        scores={zeroScores()}
        weights={DEFAULT_WEIGHTS}
        escalationTrigger={null}
      />
    );
    expect(screen.getByText(/已按比例归一化/)).toBeInTheDocument();
  });

  it("wasNormalized 为 false 时不显示归一化提示", () => {
    render(
      <LiveResultPanel
        result={{
          valueScore: 78.5,
          grade: "A",
          weightsSnapshot: DEFAULT_WEIGHTS,
          thresholdsSnapshot: { S: 85, A: 70, B: 50 },
          wasNormalized: false,
        }}
        scores={zeroScores()}
        weights={DEFAULT_WEIGHTS}
        escalationTrigger={null}
      />
    );
    expect(screen.queryByText(/已按比例归一化/)).not.toBeInTheDocument();
  });

  it("不再展示置信度", () => {
    render(
      <LiveResultPanel
        result={{
          valueScore: 78.5,
          grade: "A",
          weightsSnapshot: DEFAULT_WEIGHTS,
          thresholdsSnapshot: { S: 85, A: 70, B: 50 },
          wasNormalized: false,
        }}
        scores={zeroScores()}
        weights={DEFAULT_WEIGHTS}
        escalationTrigger={null}
      />
    );
    expect(screen.queryByText(/置信度/)).not.toBeInTheDocument();
  });

  it("设备与生态赋能按四档计贡献：1 分为 4.0", () => {
    const scores = zeroScores();
    scores.deviceEnable = { score: 1, reason: "" };
    render(
      <LiveResultPanel
        result={{
          valueScore: 4.0,
          grade: "C",
          weightsSnapshot: DEFAULT_WEIGHTS,
          thresholdsSnapshot: { S: 85, A: 70, B: 50 },
          wasNormalized: false,
        }}
        scores={scores}
        weights={DEFAULT_WEIGHTS}
        escalationTrigger={null}
      />
    );
    // 各维贡献列表中设备维一行显示 4.0
    expect(screen.getByText("设备与生态赋能").parentElement).toHaveTextContent("4.0");
  });
});
