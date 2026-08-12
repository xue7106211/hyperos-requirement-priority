import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LiveResultPanel } from "@/components/LiveResultPanel";
import { DEFAULT_WEIGHTS } from "@/domain/modelConfig";

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
        scores={{} as any}
        weights={DEFAULT_WEIGHTS}
        escalationTrigger={null}
      />
    );
    expect(screen.getByText("78.5")).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
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
        scores={{} as any}
        weights={DEFAULT_WEIGHTS}
        escalationTrigger={"legal"}
      />
    );
    expect(screen.getByText(/直升 ·/)).toBeInTheDocument();
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
        scores={{} as any}
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
        scores={{} as any}
        weights={DEFAULT_WEIGHTS}
        escalationTrigger={null}
      />
    );
    expect(screen.queryByText(/已按比例归一化/)).not.toBeInTheDocument();
  });
});
