import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DimensionRadar } from "@/components/DimensionRadar";
import type { DimensionKey, DimensionScore, ScoreValue } from "@/domain/types";
import { DIMENSION_KEYS } from "@/domain/types";
import { DIMENSION_META } from "@/domain/modelConfig";

function uniform(n: ScoreValue): Record<DimensionKey, DimensionScore> {
  const out = {} as Record<DimensionKey, DimensionScore>;
  for (const key of DIMENSION_KEYS) {
    out[key] = { score: n, reason: "" };
  }
  return out;
}

function full(): Record<DimensionKey, DimensionScore> {
  const out = {} as Record<DimensionKey, DimensionScore>;
  for (const key of DIMENSION_KEYS) {
    out[key] = { score: DIMENSION_META[key].maxScore as ScoreValue, reason: "" };
  }
  return out;
}

describe("DimensionRadar", () => {
  it("全 0 分时数据多边形收在中心", () => {
    render(<DimensionRadar scores={uniform(0)} />);
    const shape = screen.getByTestId("radar-shape");
    expect(shape.getAttribute("points")).toContain("110.0,110.0");
  });

  it("各维按自身满分打满时，多边形所有顶点都到最外圈", () => {
    render(<DimensionRadar scores={full()} />);
    const shape = screen.getByTestId("radar-shape");
    // 第一个顶点（正上方）落在 y = 110 - 72 = 38
    expect(shape.getAttribute("points")).toContain("110.0,38.0");
    // 顶点不应收在中心
    expect(shape.getAttribute("points")).not.toContain("110.0,110.0");
  });

  it("设备维 3 分与其他维 4 分在雷达上等高（均为满分）", () => {
    const a = render(<DimensionRadar scores={full()} />);
    const pointsFull = screen.getByTestId("radar-shape").getAttribute("points");
    a.unmount();

    // 设备维退回 2 分，图形应与全满不同
    const partial = full();
    partial.deviceEnable = { score: 2, reason: "" };
    render(<DimensionRadar scores={partial} />);
    expect(screen.getByTestId("radar-shape").getAttribute("points")).not.toBe(pointsFull);
  });

  it("旧记录里越界的设备维分数被收敛，不会画到圈外", () => {
    const view = render(<DimensionRadar scores={full()} />);
    const expected = screen.getByTestId("radar-shape").getAttribute("points");
    view.unmount();

    const legacy = full();
    (legacy.deviceEnable as any).score = 4; // v2.0 遗留取值
    render(<DimensionRadar scores={legacy} />);
    expect(screen.getByTestId("radar-shape").getAttribute("points")).toBe(expected);
  });

  it("第一维短标签为「美学」", () => {
    render(<DimensionRadar scores={uniform(0)} />);
    expect(screen.getByText("美学")).toBeInTheDocument();
  });
});
